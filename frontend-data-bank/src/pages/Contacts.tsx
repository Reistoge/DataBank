import { motion, AnimatePresence } from 'framer-motion';
import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getContacts, updateContacts } from '../services/api.service';
import { ANIMATION, RESOURCES, ROUTES } from '../utils/constants';
import { useAuth } from '../hooks/useAuth.hook';
import type { Contact } from '../types/auth.types';
import {
  FiArrowLeft,
  FiUser,
  FiMail,
  FiCreditCard,
  FiTrash2,
  FiEdit2,
  FiSave,
  FiX,
  FiUserPlus,
  FiTag,
  FiShoppingBag,
} from 'react-icons/fi';
import { colors, components } from '../utils/design-system';

function Contacts() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const rotation = useRef(0);

  // State
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'edit' | 'delete'>('edit');
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  const [editedContact, setEditedContact] = useState<Contact | null>(null);
  const [updateStatus, setUpdateStatus] = useState<{
    state: 'idle' | 'loading' | 'success' | 'error';
    message: string;
  }>({ state: 'idle', message: '' });

  // Fetch contacts on mount
  useEffect(() => {
    fetchContactsData();
  }, []);

  const fetchContactsData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await getContacts();
      setContacts(result || []);
    } catch (err) {
      setError('Failed to fetch contacts.');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenEditModal = (contact: Contact) => {
    setSelectedContact(contact);
    setEditedContact({ ...contact });
    setModalMode('edit');
    setIsModalOpen(true);
    setUpdateStatus({ state: 'idle', message: '' });
  };

  const handleOpenDeleteModal = (contact: Contact) => {
    setSelectedContact(contact);
    setModalMode('delete');
    setIsModalOpen(true);
    setUpdateStatus({ state: 'idle', message: '' });
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedContact(null);
    setEditedContact(null);
    setUpdateStatus({ state: 'idle', message: '' });
  };

  const handleEditChange = (field: keyof Contact, value: string) => {
    if (editedContact) {
      setEditedContact({ ...editedContact, [field]: value });
    }
  };

  const handleUpdateContact = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedContact || !editedContact) {
      setUpdateStatus({ state: 'error', message: 'No contact selected.' });
      return;
    }

    // Validation
    if (!editedContact.name.trim()) {
      setUpdateStatus({ state: 'error', message: 'Name is required.' });
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(editedContact.email)) {
      setUpdateStatus({ state: 'error', message: 'Invalid email format.' });
      return;
    }

    setUpdateStatus({ state: 'loading', message: 'Updating contact...' });
    try {
      // Find the index of the contact to update
      const updatedContacts = contacts.map((c) =>
        c.accountNumber === selectedContact.accountNumber ? editedContact : c
      );

      await updateContacts(updatedContacts);
      setContacts(updatedContacts);
      setUpdateStatus({ state: 'success', message: 'Contact updated successfully!' });

      setTimeout(() => {
        handleCloseModal();
      }, 1500);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred.';
      setUpdateStatus({ state: 'error', message: `Update failed: ${errorMessage}` });
      console.error(err);
    }
  };

  const handleDeleteContact = async () => {
    if (!selectedContact) {
      setUpdateStatus({ state: 'error', message: 'No contact selected.' });
      return;
    }

    setUpdateStatus({ state: 'loading', message: 'Deleting contact...' });
    try {
      const updatedContacts = contacts.filter(
        (c) => c.accountNumber !== selectedContact.accountNumber
      );

      await updateContacts(updatedContacts);
      setContacts(updatedContacts);
      setUpdateStatus({ state: 'success', message: 'Contact deleted successfully!' });

      setTimeout(() => {
        handleCloseModal();
      }, 1500);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred.';
      setUpdateStatus({ state: 'error', message: `Delete failed: ${errorMessage}` });
      console.error(err);
    }
  };

  const handleRotate = () => {
    const img = document.getElementById('appLogo');
    if (img) {
      rotation.current += ANIMATION.ROTATION_DEGREES;
      img.style.transform = `rotate(${rotation.current}deg)`;
      img.style.transition = `transform ${ANIMATION.TRANSITION_DURATION} ${ANIMATION.TRANSITION_EASING}`;
    }
  };

  const TRANSACTION_TYPES = ['PAYMENT', 'TRANSFER', 'PURCHASE', 'WITHDRAWAL', 'DEPOSIT'];
  const MERCHANT_CATEGORIES = [
    'GROCERIES',
    'ENTERTAINMENT',
    'UTILITIES',
    'HEALTHCARE',
    'TRANSPORTATION',
    'DINING',
    'SHOPPING',
    'OTHER',
  ];

  return (
    <div className={`min-h-screen ${colors.gradients.primary} flex flex-col`}>
      {/* Back Button */}
      <div className="fixed top-4 left-4 z-50">
        <button
          onClick={() => navigate(ROUTES.DASHBOARD)}
          className="p-3 bg-white/10 backdrop-blur-sm text-white rounded-lg hover:bg-white/20 transition-all duration-200 flex items-center gap-2"
        >
          <FiArrowLeft />
          Back
        </button>
      </div>

      <header className="text-center my-8 pt-16">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6"
        >
          <img
            id="appLogo"
            onClick={handleRotate}
            className="w-20 h-20 mx-auto rounded-xl cursor-pointer hover:shadow-lg transition-all duration-200 mb-4"
            src={RESOURCES.LOGO}
            alt="App Logo"
            title="Click to rotate!"
          />
          <h1 className="text-4xl font-bold text-white tracking-tight">
            My Contacts
          </h1>
          <p className="text-gray-300 mt-2">
            Manage your saved transaction contacts
          </p>
        </motion.div>
      </header>

      <main className="max-w-6xl mx-auto w-full px-4 pb-8">
        {/* Loading State */}
        {isLoading && (
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
            <p className="text-white mt-4">Loading contacts...</p>
          </div>
        )}

        {/* Error State */}
        {error && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="bg-red-500/20 border border-red-400 rounded-xl p-6 text-center"
          >
            <p className="text-red-200">{error}</p>
          </motion.div>
        )}

        {/* Empty State */}
        {!isLoading && !error && contacts.length === 0 && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className={`${components.card.gradient} text-center max-w-md mx-auto`}
          >
            <FiUserPlus className="text-6xl text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-white mb-2">No Contacts Yet</h3>
            <p className="text-gray-300 mb-6">
              Start adding contacts when you make transfers to save them for future transactions.
            </p>
            <button
              onClick={() => navigate(ROUTES.TRANSFER)}
              className={components.button.primary}
            >
              Make a Transfer
            </button>
          </motion.div>
        )}

        {/* Contacts Grid */}
        {!isLoading && !error && contacts.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <AnimatePresence mode="popLayout">
              {contacts.map((contact, index) => (
                <motion.div
                  key={contact.accountNumber}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ delay: index * 0.05 }}
                  className={`${components.card.gradient} hover:shadow-2xl transition-shadow duration-300`}
                >
                  {/* Contact Header */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold text-lg">
                        {contact.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <h3 className="text-lg font-bold text-white">{contact.name}</h3>
                        <p className="text-sm text-gray-400">{contact.type}</p>
                      </div>
                    </div>
                  </div>

                  {/* Contact Details */}
                  <div className="space-y-3 mb-6">
                    <div className="flex items-center gap-2 text-gray-300">
                      <FiCreditCard className="text-blue-400" />
                      <span className="text-sm">
                        {contact.accountNumber}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-gray-300">
                      <FiMail className="text-green-400" />
                      <span className="text-sm truncate">{contact.email}</span>
                    </div>
                    <div className="flex items-center gap-2 text-gray-300">
                      <FiShoppingBag className="text-purple-400" />
                      <span className="text-sm">{contact.category}</span>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleOpenEditModal(contact)}
                      className={`${components.button.secondary} flex-1 flex items-center justify-center gap-2`}
                    >
                      <FiEdit2 />
                      Edit
                    </button>
                    <button
                      onClick={() => handleOpenDeleteModal(contact)}
                      className={`${components.button.danger} flex-1 flex items-center justify-center gap-2`}
                    >
                      <FiTrash2 />
                      Delete
                    </button>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </main>

      {/* Edit/Delete Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/75 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            onClick={handleCloseModal}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className={`${components.card.gradient} w-full max-w-md`}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Modal Header */}
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                  {modalMode === 'edit' ? (
                    <>
                      <FiEdit2 />
                      Edit Contact
                    </>
                  ) : (
                    <>
                      <FiTrash2 />
                      Delete Contact
                    </>
                  )}
                </h2>
                <button
                  onClick={handleCloseModal}
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  <FiX className="text-2xl" />
                </button>
              </div>

              {/* Edit Form */}
              {modalMode === 'edit' && editedContact && (
                <form onSubmit={handleUpdateContact}>
                  <div className="space-y-4 mb-6">
                    <div>
                      <label className="block text-white font-medium mb-2 flex items-center gap-2">
                        <FiUser />
                        Name
                      </label>
                      <input
                        type="text"
                        value={editedContact.name}
                        onChange={(e) => handleEditChange('name', e.target.value)}
                        className={components.input.primary}
                        placeholder="Contact name"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-white font-medium mb-2 flex items-center gap-2">
                        <FiMail />
                        Email
                      </label>
                      <input
                        type="email"
                        value={editedContact.email}
                        onChange={(e) => handleEditChange('email', e.target.value)}
                        className={components.input.primary}
                        placeholder="contact@email.com"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-white font-medium mb-2 flex items-center gap-2">
                        <FiTag />
                        Transaction Type
                      </label>
                      <select
                        value={editedContact.type}
                        onChange={(e) => handleEditChange('type', e.target.value)}
                        className={components.input.primary}
                        required
                      >
                        {TRANSACTION_TYPES.map((type) => (
                          <option key={type} value={type}>
                            {type}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-white font-medium mb-2 flex items-center gap-2">
                        <FiShoppingBag />
                        Category
                      </label>
                      <select
                        value={editedContact.category}
                        onChange={(e) => handleEditChange('category', e.target.value)}
                        className={components.input.primary}
                        required
                      >
                        {MERCHANT_CATEGORIES.map((category) => (
                          <option key={category} value={category}>
                            {category}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="bg-white/10 rounded-lg p-3">
                      <p className="text-sm text-gray-300 flex items-center gap-2">
                        <FiCreditCard />
                        Account: {editedContact.accountNumber}
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <button
                      type="button"
                      onClick={handleCloseModal}
                      className={`${components.button.secondary} flex-1`}
                      disabled={updateStatus.state === 'loading'}
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className={`${components.button.primary} flex-1 flex items-center justify-center gap-2`}
                      disabled={updateStatus.state === 'loading'}
                    >
                      <FiSave />
                      {updateStatus.state === 'loading' ? 'Saving...' : 'Save Changes'}
                    </button>
                  </div>
                </form>
              )}

              {/* Delete Confirmation */}
              {modalMode === 'delete' && selectedContact && (
                <div>
                  <div className="bg-red-500/20 border border-red-400 rounded-lg p-4 mb-6">
                    <p className="text-white mb-4">
                      Are you sure you want to delete this contact?
                    </p>
                    <div className="bg-white/10 rounded-lg p-3 space-y-2">
                      <p className="text-white font-semibold">{selectedContact.name}</p>
                      <p className="text-gray-300 text-sm">{selectedContact.email}</p>
                      <p className="text-gray-300 text-sm">{selectedContact.accountNumber}</p>
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <button
                      onClick={handleCloseModal}
                      className={`${components.button.secondary} flex-1`}
                      disabled={updateStatus.state === 'loading'}
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleDeleteContact}
                      className={`${components.button.danger} flex-1 flex items-center justify-center gap-2`}
                      disabled={updateStatus.state === 'loading'}
                    >
                      <FiTrash2 />
                      {updateStatus.state === 'loading' ? 'Deleting...' : 'Delete Contact'}
                    </button>
                  </div>
                </div>
              )}

              {/* Status Message */}
              {updateStatus.state !== 'idle' && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`mt-4 p-3 rounded-lg text-center text-sm ${
                    updateStatus.state === 'error'
                      ? 'bg-red-500/20 border border-red-400 text-red-200'
                      : updateStatus.state === 'success'
                      ? 'bg-green-500/20 border border-green-400 text-green-200'
                      : 'bg-blue-500/20 border border-blue-400 text-blue-200'
                  }`}
                >
                  {updateStatus.message}
                </motion.div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Footer */}
      <footer className="text-center py-6 mt-auto">
        <a
          href="https://github.com/Reistoge"
          target="_blank"
          rel="noopener noreferrer"
          className="text-gray-400 hover:text-white transition-colors duration-200"
        >
          @Ferran Rojas
        </a>
      </footer>
    </div>
  );
}

export default Contacts;