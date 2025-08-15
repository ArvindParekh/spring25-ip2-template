import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

import {
  getUserByUsername,
  deleteUser,
  resetPassword,
  updateBiography,
} from '../services/userService';
import { User } from '../types';
import useUserContext from './useUserContext';

/**
 * A custom hook to encapsulate all logic/state for the ProfileSettings component.
 */
const useProfileSettings = () => {
  // Gets the username of the user being viewed from the URL
  const { username } = useParams<{ username: string }>();
  const navigate = useNavigate();
  // This is the user currently logged in
  const { user: currentUser } = useUserContext();

  // Local state
  const [userData, setUserData] = useState<User | null>(null);
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [editBioMode, setEditBioMode] = useState(false);
  const [newBio, setNewBio] = useState('');
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // For delete-user confirmation modal
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [pendingAction, setPendingAction] = useState<(() => void) | null>(null);

  const [showPassword, setShowPassword] = useState(false);

  // TODO: Task 1 - Determine if the current user can edit the profile being viewed
  const canEditProfile = username === currentUser.username; // Replace false with the correct condition

  useEffect(() => {
    if (!username) return;

    const fetchUserData = async () => {
      try {
        setLoading(true);
        const data = await getUserByUsername(username);
        setUserData(data);
      } catch (error) {
        setErrorMessage('Error fetching user profile');
        setUserData(null);
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, [username]);

  /**
   * Toggles the visibility of the password fields.
   */
  const togglePasswordVisibility = () => {
    // TODO: Task 1 - Toggle the password visibility.
    setShowPassword(prev => !prev);
  };

  /**
   * Validate the password fields before attempting to reset.
   */
  const validatePasswords = () => {
    // TODO: Task 1 - Validate the reset password fields and return whether they match
    if (!newPassword || !confirmNewPassword) {
      setErrorMessage('Password fields are required');
      return false;
    }
    if (newPassword !== confirmNewPassword) {
      setErrorMessage('Passwords do not match');
      return false;
    }
    return true;
  };

  /**
   * Handler for resetting the password
   */
  const handleResetPassword = async () => {
    if (!username) return;

    // TODO: Task 1 - Implement the password reset functionality.
    // Validate the password fields, then call the resetPassword service.
    if (!validatePasswords()) return;
    try {
      const resetResponse = await resetPassword(username, newPassword);
      setUserData(resetResponse);
      setSuccessMessage('Password reset successful');
    } catch (error) {
      setErrorMessage('Error resetting password');
    }

    setNewPassword('');
    setConfirmNewPassword('');
    // Display success or error messages accordingly, and clear the password fields.
  };

  const handleUpdateBiography = async () => {
    if (!username) return;

    // TODO: Task 1 - Implement the biography update functionality.
    // Call the updateBiography service, set the updated user,
    // then display success or error messages.
    try {
      const updateResponse = await updateBiography(username, newBio);
      setUserData(updateResponse);
      setSuccessMessage('Biography updated successfully');
    } catch (error) {
      setErrorMessage('Error updating biography');
    }
    setNewBio('');
  };

  /**
   * Handler for deleting the user (triggers confirmation modal)
   */
  const handleDeleteUser = () => {
    if (!username) return;

    // Display the confirmation modal
    setShowConfirmation(true);
    setPendingAction(() => async () => {
      // TODO: Task 1 - Call the deleteUser service and handle the response,
      // displating success or error messages accordingly.
      try {
        const deleteResponse = await deleteUser(username);
        setUserData(deleteResponse);
        setSuccessMessage('User deleted successfully');
        navigate('/');
      } catch (error) {
        setErrorMessage('Error deleting user');
      } finally {
        // Hide the confirmation modal after completion
        setShowConfirmation(false);
      }
    });
  };

  return {
    userData,
    newPassword,
    confirmNewPassword,
    setNewPassword,
    setConfirmNewPassword,
    loading,
    editBioMode,
    setEditBioMode,
    newBio,
    setNewBio,
    successMessage,
    errorMessage,
    showConfirmation,
    setShowConfirmation,
    pendingAction,
    setPendingAction,
    canEditProfile,
    showPassword,
    togglePasswordVisibility,
    handleResetPassword,
    handleUpdateBiography,
    handleDeleteUser,
  };
};

export default useProfileSettings;
