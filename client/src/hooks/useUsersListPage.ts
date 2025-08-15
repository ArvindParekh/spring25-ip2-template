import { useEffect, useState } from 'react';
import useUserContext from './useUserContext';
import { User, UserUpdatePayload } from '../types';
import { getUsers } from '../services/userService';

/**
 * Custom hook for managing the users list page state, filtering, and real-time updates.
 *
 * @returns titleText - The current title of the users list page
 * @returns ulist - The list of users to display
 * @returns setUserFilter - Function to set the filtering value of the user search.
 */
const useUsersListPage = () => {
  const { socket } = useUserContext();

  const [userFilter, setUserFilter] = useState<string>('');
  const [userList, setUserList] = useState<User[]>([]);

  useEffect(() => {
    /**
     * Function to fetch users based and update the user list
     */
    const fetchData = async () => {
      try {
        const res = await getUsers();
        setUserList(res || []);
      } catch (error) {
        // eslint-disable-next-line no-console
        console.log(error);
      }
    };

    /**
     * Removes a user from the userList using a filter
     * @param prevUserList the list of users
     * @param user the user to remove
     * @returns a list without the given user
     */
    const removeUserFromList = (prevUserList: User[], user: User) =>
      // TODO: Task 1 - Implement the function to remove a user from the list
      prevUserList.filter(prevUser => prevUser.username !== user.username);
    /**
     * Adds a user to the userList, if not present. Otherwise updates the user.
     * @param prevUserList the list of users
     * @param user the user to add
     * @returns a list with the user added, or updated if present.
     */
    const addUserToList = (prevUserList: User[], user: User) => {
      // TODO: Task 1 - Implement the function to add or update a user in the list
      // Add the user to the front of the list if it doesn't already exist
      const userIndex = prevUserList.findIndex(prevUser => prevUser.username === user.username);
      if (userIndex === -1) return [user, ...prevUserList];

      const newUserList = [...prevUserList];
      newUserList[userIndex] = { ...newUserList[userIndex], ...user };
      return newUserList;
    };

    /**
     * Function to handle user updates from the socket.
     *
     * @param user - the updated user object.
     */
    const handleModifiedUserUpdate = (userUpdate: UserUpdatePayload) => {
      // TODO: Task 1 - Update the user list based on the user update type.
      const { user, type } = userUpdate;
      if (type === 'created') {
        setUserList(prevList => addUserToList(prevList, user));
      } else if (type === 'deleted') {
        setUserList(prevList => removeUserFromList(prevList, user));
      }
    };

    fetchData();

    socket.on('userUpdate', handleModifiedUserUpdate);

    return () => {
      socket.off('userUpdate', handleModifiedUserUpdate);
    };
  }, [socket]);

  // TODO: Task 1 - Filter the user list based on the userFilter value
  const filteredUserlist = userList.filter(user =>
    user.username.toLowerCase().includes(userFilter.toLowerCase()),
  );
  return { userList: filteredUserlist, setUserFilter };
};

export default useUsersListPage;
