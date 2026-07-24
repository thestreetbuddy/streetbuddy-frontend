import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Avatar,
  Box,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Divider,
  FormControl,
  FormControlLabel,
  FormHelperText,
  IconButton,
  InputAdornment,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Snackbar,
  Alert,
  Skeleton,
  Switch,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TablePagination,
  TableRow,
  TableSortLabel,
  TextField,
  Toolbar,
  Tooltip,
  Typography,
} from '@mui/material';
import {
  ArrowLeft,
  BadgeCheck,
  Calendar,
  Camera,
  CheckCircle,
  Clock,
  Download,
  Edit,
  Eye,
  Image as ImageIcon,
  Mail,
  MapPin,
  Phone,
  Plus,
  RefreshCcw,
  Search,
  ShieldCheck,
  Tag,
  Trash2,
  UploadCloud,
  UserCircle,
  UserPlus,
  Users as UsersIcon,
  X,
} from 'lucide-react';
import { useDropzone } from 'react-dropzone';
import { createUser, deleteUser, getUser, getUsers, updateUser, updateUserStatus } from '../api/userApi';

import '../styles/users.css';

const statusOptions = ['Active', 'Blocked', 'Suspended', 'Pending'];
const verificationOptions = ['Verified', 'Not Verified'];
const loginTypeOptions = ['Email', 'Google'];
const genderOptions = ['Male', 'Female', 'Other', 'Prefer not to say'];
const interestSuggestions = ['Street Food', 'Cafe', 'Photography', 'Travel', 'Night Market'];

const emptyUserForm = {
  username: '',
  fullName: '',
  gender: '',
  birthdate: '',
  bio: '',
  email: '',
  phone: '',
  state: '',
  city: '',
  password: '',
  confirmPassword: '',
  loginType: 'Email',
  emailVerified: false,
  status: 'Pending',
  active: true,
  interests: [],
  profileImage: '',
  coverImage: '',
  profileFile: null,
  coverFile: null,
};

const toTitleCase = (value, fallback = '') => {
  if (value === null || value === undefined || value === '') return fallback;
  const text = String(value).replace(/_/g, ' ').toLowerCase();
  return text.replace(/\b\w/g, (letter) => letter.toUpperCase());
};

const toBoolean = (value) => value === true || value === 1 || value === '1' || value === 'true';

const normalizeUser = (user = {}) => ({
  id: user.id,
  username: user.username || '',
  fullName: user.full_name || user.fullName || '',
  email: user.email || '',
  phone: user.phone || '',
  bio: user.bio || '',
  gender: toTitleCase(user.gender),
  birthdate: user.birthdate ? String(user.birthdate).slice(0, 10) : '',
  state: user.state || '',
  city: user.city || '',
  loginType: toTitleCase(user.login_type ?? user.loginType, 'Email'),
  profileImage: user.profile_photo || user.profileImage || '',
  coverImage: user.cover_photo || user.coverImage || '',
  emailVerified: toBoolean(user.email_verified ?? user.emailVerified),
  status: toTitleCase(user.status, 'Pending'),
  active: toBoolean(user.is_active ?? user.active),
  lastLogin: user.last_login || user.lastLogin || 'N/A',
  createdAt: user.created_at || user.createdAt || '',
  updatedAt: user.updated_at || user.updatedAt || '',
  isDeleted: toBoolean(user.is_deleted ?? user.isDeleted),
  interests: Array.isArray(user.interests) ? user.interests : [],
});

const extractPayload = (response) => {
  let payload = response?.data;
  while (payload?.data && !Array.isArray(payload) && typeof payload.data === 'object') {
    payload = payload.data;
  }
  return payload;
};

const extractUsers = (response) => {
  const payload = extractPayload(response);
  const records = Array.isArray(payload) ? payload : payload?.data || payload?.users || [];
  return Array.isArray(records) ? records.map(normalizeUser) : [];
};

const getErrorMessage = (error) => error?.response?.data?.message || error?.message || 'Something went wrong. Please try again.';

const getValidationErrors = (error) => {
  const errors = error?.response?.data?.errors;
  if (!errors || typeof errors !== 'object') return {};
  const fieldMap = {
    full_name: 'fullName', login_type: 'loginType', email_verified: 'emailVerified',
    is_active: 'active', profile_photo: 'profileImage', cover_photo: 'coverImage',
  };
  return Object.entries(errors).reduce((result, [field, messages]) => ({
    ...result,
    [fieldMap[field] || field]: Array.isArray(messages) ? messages[0] : String(messages),
  }), {});
};

const headCells = [
  { id: 'rowNumber', label: '#', sortable: false },
  { id: 'profile', label: 'Profile', sortable: false },
  { id: 'fullName', label: 'Full Name', sortable: true },
  { id: 'username', label: 'Username', sortable: true },
  { id: 'email', label: 'Email', sortable: true },
  { id: 'phone', label: 'Phone', sortable: false },
  { id: 'state', label: 'State', sortable: true },
  { id: 'city', label: 'City', sortable: true },
  { id: 'loginType', label: 'Login Type', sortable: true },
  { id: 'emailVerified', label: 'Email Verified', sortable: true },
  { id: 'status', label: 'Status', sortable: true },
  { id: 'createdAt', label: 'Created Date', sortable: true },
  { id: 'actions', label: 'Actions', sortable: false },
];

const textFieldSx = {
  '& .MuiOutlinedInput-root': {
    borderRadius: '16px',
    background: '#fff',
    '& fieldset': {
      borderColor: '#ececec',
    },
    '&:hover fieldset': {
      borderColor: '#ff8a3d',
    },
    '&.Mui-focused fieldset': {
      borderColor: '#ff8a3d',
      borderWidth: 2,
    },
  },
  '& .MuiFormHelperText-root': {
    marginLeft: 0,
    fontWeight: 600,
  },
};

const selectSx = {
  borderRadius: '16px',
  background: '#fff',
  '& .MuiOutlinedInput-notchedOutline': {
    borderColor: '#ececec',
  },
  '&:hover .MuiOutlinedInput-notchedOutline': {
    borderColor: '#ff8a3d',
  },
  '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
    borderColor: '#ff8a3d',
    borderWidth: 2,
  },
};

const actionButtonSx = {
  width: 42,
  height: 42,
  borderRadius: '12px',
};

const statusChipStyles = {
  Pending: {
    color: '#b45309',
    background: '#fff7ed',
    borderColor: '#fed7aa',
  },
  Active: {
    color: '#15803d',
    background: '#f0fdf4',
    borderColor: '#bbf7d0',
  },
  Blocked: {
    color: '#b91c1c',
    background: '#fef2f2',
    borderColor: '#fecaca',
  },
  Suspended: {
    color: '#7e22ce',
    background: '#faf5ff',
    borderColor: '#e9d5ff',
  },
};

const statusSelectStyles = {
  Pending: { color: '#b45309', backgroundColor: '#fff7ed' },
  Active: { color: '#15803d', backgroundColor: '#f0fdf4' },
  Blocked: { color: '#b91c1c', backgroundColor: '#fef2f2' },
  Suspended: { color: '#6b7280', backgroundColor: '#f3f4f6' },
};

const formatDate = (value) => {
  if (!value) return 'N/A';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  return new Intl.DateTimeFormat('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(date);
};

const getInitials = (name = '') => {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return 'U';
  return parts.slice(0, 2).map((part) => part[0]).join('').toUpperCase();
};

const getSortValue = (user, key) => {
  if (key === 'emailVerified' || key === 'active') return user[key] ? 1 : 0;
  return String(user[key] ?? '').toLowerCase();
};

function descendingComparator(a, b, orderBy) {
  const left = getSortValue(a, orderBy);
  const right = getSortValue(b, orderBy);

  if (right < left) return -1;
  if (right > left) return 1;
  return 0;
}

function getComparator(order, orderBy) {
  return order === 'desc'
    ? (a, b) => descendingComparator(a, b, orderBy)
    : (a, b) => -descendingComparator(a, b, orderBy);
}

function stableSort(items, comparator) {
  return items
    .map((item, index) => [item, index])
    .sort((a, b) => {
      const order = comparator(a[0], b[0]);
      return order !== 0 ? order : a[1] - b[1];
    })
    .map((item) => item[0]);
}

function StatusChip({ status }) {
  const style = statusChipStyles[status] || statusChipStyles.Pending;

  return (
    <Chip
      label={status || 'Pending'}
      size="small"
      variant="outlined"
      sx={{
        minWidth: 92,
        borderRadius: '999px',
        fontWeight: 800,
        ...style,
      }}
    />
  );
}

function VerifiedChip({ verified }) {
  return (
    <Chip
      icon={verified ? <BadgeCheck size={15} /> : undefined}
      label={verified ? 'Verified' : 'Not Verified'}
      size="small"
      sx={{
        minWidth: verified ? 92 : 112,
        borderRadius: '999px',
        color: verified ? '#15803d' : '#64748b',
        background: verified ? '#f0fdf4' : '#f8fafc',
        border: `1px solid ${verified ? '#bbf7d0' : '#e2e8f0'}`,
        fontWeight: 800,
        '& .MuiChip-icon': {
          color: 'inherit',
        },
      }}
    />
  );
}

function ActiveChip({ active }) {
  return (
    <Chip
      icon={active ? <CheckCircle size={15} /> : undefined}
      label={active ? 'Active' : 'Inactive'}
      size="small"
      sx={{
        borderRadius: '999px',
        color: active ? '#15803d' : '#6b7280',
        background: active ? '#f0fdf4' : '#f3f4f6',
        border: `1px solid ${active ? '#bbf7d0' : '#e5e7eb'}`,
        fontWeight: 800,
        '& .MuiChip-icon': {
          color: 'inherit',
        },
      }}
    />
  );
}

function ProfileAvatar({ user, size = 52 }) {
  return (
    <Avatar
      src={user.profileImage}
      alt={user.fullName}
      sx={{
        width: size,
        height: size,
        color: '#fff',
        fontWeight: 800,
        background: 'linear-gradient(135deg,#ff8a3d,#ff7a1a)',
        boxShadow: '0 10px 22px rgba(255,122,26,.22)',
      }}
    >
      {getInitials(user.fullName)}
    </Avatar>
  );
}

function InfoItem({ icon, label, value }) {
  return (
    <div className="user-info-item">
      <span className="user-info-icon">{icon}</span>
      <span>
        <small>{label}</small>
        <strong>{value ?? 'N/A'}</strong>
      </span>
    </div>
  );
}

function InfoCard({ title, icon, children }) {
  return (
    <section className="user-info-card">
      <div className="user-info-card-head">
        <span>{icon}</span>
        <h3>{title}</h3>
      </div>
      <div className="user-info-card-body">{children}</div>
    </section>
  );
}

function UsersTableHead({ order, orderBy, onRequestSort }) {
  const createSortHandler = (property) => () => {
    onRequestSort(property);
  };

  return (
    <TableHead>
      <TableRow>
        {headCells.map((headCell) => (
          <TableCell key={headCell.id}>
            {headCell.sortable ? (
              <TableSortLabel
                active={orderBy === headCell.id}
                direction={orderBy === headCell.id ? order : 'asc'}
                onClick={createSortHandler(headCell.id)}
              >
                {headCell.label}
              </TableSortLabel>
            ) : (
              headCell.label
            )}
          </TableCell>
        ))}
      </TableRow>
    </TableHead>
  );
}

function UsersTableSkeleton() {
  return (
    <TableBody>
      {Array.from({ length: 6 }).map((_, index) => (
        <TableRow key={`users-skeleton-${index}`}>
          {headCells.map((cell) => (
            <TableCell key={`${cell.id}-${index}`}>
              {cell.id === 'profile' ? (
                <Skeleton variant="circular" width={52} height={52} />
              ) : (
                <Skeleton variant="text" height={28} />
              )}
            </TableCell>
          ))}
        </TableRow>
      ))}
    </TableBody>
  );
}

function UsersLoadingCards() {
  return (
    <div className="users-loading-cards">
      {Array.from({ length: 3 }).map((_, index) => (
        <div className="users-loading-card" key={`users-loading-card-${index}`}>
          <Skeleton variant="circular" width={48} height={48} />
          <div>
            <Skeleton variant="text" width={120} height={26} />
            <Skeleton variant="text" width={180} height={20} />
          </div>
        </div>
      ))}
    </div>
  );
}

function UploadCard({ title, description, variant, imageUrl, error, onUpload, onRemove }) {
  const onDrop = (acceptedFiles) => {
    if (acceptedFiles[0]) onUpload(acceptedFiles[0]);
  };

  const { getRootProps, getInputProps, isDragActive, open } = useDropzone({
    accept: {
      'image/*': ['.jpg', '.jpeg', '.png', '.webp'],
    },
    multiple: false,
    noClick: true,
    onDrop,
  });

  return (
    <div className={`user-upload-card ${variant} ${isDragActive ? 'is-dragging' : ''} ${error ? 'has-error' : ''}`}>
      <div {...getRootProps({ className: 'user-upload-dropzone' })}>
        <input {...getInputProps()} />
        {imageUrl ? (
          <img src={imageUrl} alt={title} />
        ) : (
          <div className="user-upload-placeholder">
            <span><UploadCloud size={34} /></span>
            <strong>{title}</strong>
            <small>{description}</small>
          </div>
        )}
      </div>

      <div className="user-upload-actions">
        <Button variant="contained" startIcon={<Camera size={16} />} onClick={open}>
          {imageUrl ? 'Replace Image' : 'Upload Image'}
        </Button>
        {imageUrl && (
          <Button variant="text" color="error" startIcon={<X size={16} />} onClick={onRemove}>
            Remove Image
          </Button>
        )}
      </div>
      {error && <p className="user-upload-error">{error}</p>}
    </div>
  );
}

function UserFormSection({ icon, title, children }) {
  return (
    <section className="user-form-section">
      <div className="user-form-section-head">
        <span>{icon}</span>
        <h2>{title}</h2>
      </div>
      <Divider />
      <div className="user-form-grid">{children}</div>
    </section>
  );
}

function Users() {
  const [view, setView] = useState('list');
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isDetailsLoading, setIsDetailsLoading] = useState(false);
  const [updatingStatusId, setUpdatingStatusId] = useState(null);

  const [order, setOrder] = useState('desc');
  const [orderBy, setOrderBy] = useState('createdAt');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [verificationFilter, setVerificationFilter] = useState('all');
  const [loginTypeFilter, setLoginTypeFilter] = useState('all');

  const [formData, setFormData] = useState(emptyUserForm);
  const [formErrors, setFormErrors] = useState({});
  const [interestInput, setInterestInput] = useState('');
  const generatedUrlsRef = useRef(new Set());

  const loadUsers = async (showLoader = true) => {
    if (showLoader) setIsLoading(true);
    setErrorMessage('');
    try {
      const response = await getUsers();
      setUsers(extractUsers(response));
    } catch (error) {
      setErrorMessage(getErrorMessage(error));
      if (showLoader) setUsers([]);
    } finally {
      if (showLoader) setIsLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  useEffect(() => () => {
    generatedUrlsRef.current.forEach((url) => URL.revokeObjectURL(url));
    generatedUrlsRef.current.clear();
  }, []);

  const filteredUsers = useMemo(() => {
    const search = searchTerm.trim().toLowerCase();

    return users
      .filter((user) => !user.isDeleted)
      .filter((user) => {
        if (!search) return true;
        return [
          user.fullName,
          user.username,
          user.email,
          user.phone,
        ].some((value) => String(value || '').toLowerCase().includes(search));
      })
      .filter((user) => statusFilter === 'all' || user.status === statusFilter)
      .filter((user) => {
        if (verificationFilter === 'all') return true;
        return verificationFilter === 'Verified' ? user.emailVerified : !user.emailVerified;
      })
      .filter((user) => loginTypeFilter === 'all' || user.loginType === loginTypeFilter);
  }, [users, searchTerm, statusFilter, verificationFilter, loginTypeFilter]);

  const visibleUsers = useMemo(() => {
    const sortedUsers = stableSort(filteredUsers, getComparator(order, orderBy));
    return sortedUsers.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);
  }, [filteredUsers, order, orderBy, page, rowsPerPage]);

  const resetMessages = () => {
    setSuccessMessage('');
    setErrorMessage('');
  };

  const resetForm = () => {
    setFormData(emptyUserForm);
    setFormErrors({});
    setInterestInput('');
  };

  const handleCreate = () => {
    resetMessages();
    resetForm();
    setSelectedUser(null);
    setView('create');
  };

  const handleBackToList = () => {
    resetMessages();
    setView('list');
    setSelectedUser(null);
    setDeleteTarget(null);
    setFormErrors({});
  };

  const fetchUserById = async (user, nextView) => {
    resetMessages();
    setIsDetailsLoading(true);
    try {
      const response = await getUser(user.id);
      const record = normalizeUser(extractPayload(response));
      setSelectedUser(record);
      if (nextView === 'edit') populateEditForm(record);
      setView(nextView);
    } catch (error) {
      setErrorMessage(getErrorMessage(error));
    } finally {
      setIsDetailsLoading(false);
    }
  };

  const handleView = (user) => fetchUserById(user, 'details');

  const populateEditForm = (user) => {
    setFormData({
      username: user.username || '',
      fullName: user.fullName || '',
      gender: user.gender || '',
      birthdate: user.birthdate || '',
      bio: user.bio || '',
      email: user.email || '',
      phone: user.phone || '',
      state: user.state || '',
      city: user.city || '',
      password: '',
      confirmPassword: '',
      loginType: user.loginType || 'Email',
      emailVerified: Boolean(user.emailVerified),
      status: user.status || 'Pending',
      active: Boolean(user.active),
      interests: Array.isArray(user.interests) ? user.interests : [],
      profileImage: user.profileImage || '',
      coverImage: user.coverImage || '',
      profileFile: null,
      coverFile: null,
    });
    setFormErrors({});
    setInterestInput('');
  };

  const handleEdit = (user) => fetchUserById(user, 'edit');

  const handleRequestSort = (property) => {
    const isAsc = orderBy === property && order === 'asc';
    setOrder(isAsc ? 'desc' : 'asc');
    setOrderBy(property);
  };

  const handleChangePage = (_, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleFilterChange = (setter) => (event) => {
    setter(event.target.value);
    setPage(0);
  };

  const handleResetFilters = () => {
    setSearchTerm('');
    setStatusFilter('all');
    setVerificationFilter('all');
    setLoginTypeFilter('all');
    setPage(0);
  };

  const handleStatusChange = async (user, status) => {
    const previousStatus = user.status;
    setUpdatingStatusId(user.id);
    setUsers((currentUsers) => currentUsers.map((item) => (
      item.id === user.id ? { ...item, status } : item
    )));
    try {
      await updateUserStatus(user.id, { status: status.toLowerCase() });
      await loadUsers(false);
      setSuccessMessage('User status updated successfully.');
    } catch (error) {
      setUsers((currentUsers) => currentUsers.map((item) => (
        item.id === user.id ? { ...item, status: previousStatus } : item
      )));
      setErrorMessage(getErrorMessage(error));
    } finally {
      setUpdatingStatusId(null);
    }
  };

  const handleExport = () => {
    setSuccessMessage('Export button is ready for API integration.');
  };

  const handleFormChange = (event) => {
    const { name, value, checked, type } = event.target;
    setFormData((currentForm) => {
      const nextValue = type === 'checkbox' ? checked : value;
      const nextForm = {
        ...currentForm,
        [name]: nextValue,
      };

      return nextForm;
    });

    setFormErrors((currentErrors) => ({ ...currentErrors, [name]: '' }));
  };

  const handleImageUpload = (field) => (file) => {
    const previewUrl = URL.createObjectURL(file);
    generatedUrlsRef.current.add(previewUrl);

    setFormData((currentForm) => ({
      ...currentForm,
      [field]: previewUrl,
      [field === 'profileImage' ? 'profileFile' : 'coverFile']: file,
    }));
    setFormErrors((currentErrors) => ({ ...currentErrors, [field]: '' }));
  };

  const handleImageRemove = (field) => () => {
    setFormData((currentForm) => ({
      ...currentForm,
      [field]: view === 'edit' ? selectedUser?.[field] || '' : '',
      [field === 'profileImage' ? 'profileFile' : 'coverFile']: null,
    }));
  };

  const addInterest = (value = interestInput) => {
    const nextInterest = value.trim();
    if (!nextInterest) return;

    setFormData((currentForm) => {
      const exists = currentForm.interests.some((interest) => interest.toLowerCase() === nextInterest.toLowerCase());
      if (exists) return currentForm;

      return {
        ...currentForm,
        interests: [...currentForm.interests, nextInterest],
      };
    });
    setInterestInput('');
    setFormErrors((currentErrors) => ({ ...currentErrors, interests: '' }));
  };

  const removeInterest = (interestToRemove) => {
    setFormData((currentForm) => ({
      ...currentForm,
      interests: currentForm.interests.filter((interest) => interest !== interestToRemove),
    }));
  };

  const handleInterestKeyDown = (event) => {
    if (event.key === 'Enter') {
      event.preventDefault();
      addInterest();
    }
  };

  const validateForm = () => {
    const errors = {};
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const phoneDigits = formData.phone.replace(/\D/g, '');
    const isCreate = view === 'create';

    if (!formData.username.trim()) errors.username = 'Username is required.';
    if (formData.username && !/^[a-zA-Z0-9_.]{3,24}$/.test(formData.username)) {
      errors.username = 'Use 3-24 letters, numbers, dots or underscores.';
    }
    if (!formData.fullName.trim()) errors.fullName = 'Full name is required.';
    if (!formData.gender) errors.gender = 'Select gender.';
    if (!formData.birthdate) errors.birthdate = 'Birthdate is required.';
    if (!formData.email.trim()) errors.email = 'Email is required.';
    if (formData.email && !emailPattern.test(formData.email)) errors.email = 'Enter a valid email address.';
    if (!formData.phone.trim()) errors.phone = 'Phone number is required.';
    if (formData.phone && phoneDigits.length < 10) errors.phone = 'Enter a valid phone number.';
    if (!formData.state.trim()) errors.state = 'State is required.';
    if (formData.state.trim().length > 120) errors.state = 'State must be 120 characters or fewer.';
    if (!formData.city.trim()) errors.city = 'City is required.';
    if (formData.city.trim().length > 120) errors.city = 'City must be 120 characters or fewer.';
    if (!formData.loginType) errors.loginType = 'Select login type.';
    if (!formData.status) errors.status = 'Select status.';
    if (isCreate && !formData.password) errors.password = 'Password is required.';
    if (formData.password && formData.password.length < 8) errors.password = 'Password must be at least 8 characters.';
    if (isCreate && !formData.confirmPassword) errors.confirmPassword = 'Confirm password is required.';
    if (formData.password !== formData.confirmPassword) errors.confirmPassword = 'Passwords do not match.';
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const buildUserPayload = (isEdit) => {
    const data = new FormData();
    const fields = [
      ['username', formData.username.trim(), selectedUser?.username],
      ['full_name', formData.fullName.trim(), selectedUser?.fullName],
      ['email', formData.email.trim(), selectedUser?.email],
      ['phone', formData.phone.trim(), selectedUser?.phone],
      ['bio', formData.bio.trim(), selectedUser?.bio],
      ['gender', formData.gender.toLowerCase(), selectedUser?.gender?.toLowerCase()],
      ['birthdate', formData.birthdate, selectedUser?.birthdate],
      ['state', formData.state.trim(), selectedUser?.state],
      ['city', formData.city.trim(), selectedUser?.city],
      ['login_type', formData.loginType.toLowerCase(), selectedUser?.loginType?.toLowerCase()],
      ['email_verified', formData.emailVerified ? '1' : '0', selectedUser?.emailVerified ? '1' : '0'],
      ['status', formData.status.toLowerCase(), selectedUser?.status?.toLowerCase()],
      ['is_active', formData.active ? '1' : '0', selectedUser?.active ? '1' : '0'],
    ];
    fields.forEach(([key, value, original]) => {
      if (value !== '' && (!isEdit || String(value) !== String(original ?? ''))) data.append(key, value);
    });
    if (formData.password) data.append('password', formData.password);
    if (formData.profileFile) data.append('profile_photo', formData.profileFile);
    if (formData.coverFile) data.append('cover_photo', formData.coverFile);
    return data;
  };

  const handleFormSubmit = async (event) => {
    event.preventDefault();
    resetMessages();

    if (!validateForm()) return;

    setIsSubmitting(true);
    try {
      const isEdit = view === 'edit' && selectedUser;
      const payload = buildUserPayload(Boolean(isEdit));
      if (isEdit && Array.from(payload.keys()).length === 0) {
        setSuccessMessage('No changes to update.');
        return;
      }
      await (isEdit ? updateUser(selectedUser.id, payload) : createUser(payload));
      setView('list');
      setSelectedUser(null);
      setPage(0);
      await loadUsers();
      setSuccessMessage(isEdit ? 'User updated successfully.' : 'User created successfully.');
    } catch (error) {
      setFormErrors((current) => ({ ...current, ...getValidationErrors(error) }));
      setErrorMessage(getErrorMessage(error));
    } finally {
      setIsSubmitting(false);
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      await deleteUser(deleteTarget.id);
      setDeleteTarget(null);
      await loadUsers();
      setSuccessMessage('User deleted successfully.');
    } catch (error) {
      setErrorMessage(getErrorMessage(error));
    } finally {
      setIsDeleting(false);
    }
  };

  const renderListView = () => (
    <Paper className="users-panel">
      <Toolbar className="users-list-header">
        <div className="users-title-block">
          <span className="users-title-icon"><UsersIcon size={28} /></span>
          <div>
            <Typography component="h2">Users</Typography>
            <Typography component="p">Manage all registered users.</Typography>
          </div>
        </div>

        <Button variant="contained" startIcon={<UserPlus size={18} />} onClick={handleCreate} disabled={isDetailsLoading}>
          Create User
        </Button>
      </Toolbar>

      <div className="users-toolbar">
        <TextField
          value={searchTerm}
          onChange={(event) => {
            setSearchTerm(event.target.value);
            setPage(0);
          }}
          placeholder="Search by name, username, email or phone"
          label="Search User"
          sx={textFieldSx}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <Search size={18} color="#ff8a3d" />
              </InputAdornment>
            ),
          }}
        />

        <FormControl sx={textFieldSx}>
          <InputLabel>Status</InputLabel>
          <Select value={statusFilter} label="Status" onChange={handleFilterChange(setStatusFilter)} sx={selectSx}>
            <MenuItem value="all">All Status</MenuItem>
            {statusOptions.map((status) => <MenuItem key={status} value={status}>{status}</MenuItem>)}
          </Select>
        </FormControl>

        <FormControl sx={textFieldSx}>
          <InputLabel>Email Verification</InputLabel>
          <Select value={verificationFilter} label="Email Verification" onChange={handleFilterChange(setVerificationFilter)} sx={selectSx}>
            <MenuItem value="all">All Verification</MenuItem>
            {verificationOptions.map((option) => <MenuItem key={option} value={option}>{option}</MenuItem>)}
          </Select>
        </FormControl>

        <FormControl sx={textFieldSx}>
          <InputLabel>Login Type</InputLabel>
          <Select value={loginTypeFilter} label="Login Type" onChange={handleFilterChange(setLoginTypeFilter)} sx={selectSx}>
            <MenuItem value="all">All Login Types</MenuItem>
            {loginTypeOptions.map((type) => <MenuItem key={type} value={type}>{type}</MenuItem>)}
          </Select>
        </FormControl>

        <div className="users-toolbar-actions">
          <Button variant="outlined" startIcon={<RefreshCcw size={17} />} onClick={handleResetFilters}>
            Reset Filters
          </Button>
          <Button variant="outlined" startIcon={<Download size={17} />} onClick={handleExport}>
            Export
          </Button>
        </div>
      </div>

      {isLoading && <UsersLoadingCards />}

      <TableContainer className="users-table-wrap">
        <Table className="users-table">
          <UsersTableHead order={order} orderBy={orderBy} onRequestSort={handleRequestSort} />
          {isLoading ? (
            <UsersTableSkeleton />
          ) : (
            <TableBody>
              {visibleUsers.length > 0 ? visibleUsers.map((user, index) => (
                <TableRow hover key={user.id}>
                  <TableCell>#{page * rowsPerPage + index + 1}</TableCell>
                  <TableCell>
                    <ProfileAvatar user={user} />
                  </TableCell>
                  <TableCell>
                    <strong className="users-table-name">{user.fullName}</strong>
                  </TableCell>
                  <TableCell>@{user.username}</TableCell>
                  <TableCell>{user.email}</TableCell>
                  <TableCell>{user.phone}</TableCell>
                  <TableCell>{user.state}</TableCell>
                  <TableCell>{user.city}</TableCell>
                  <TableCell>
                    <Chip label={user.loginType} size="small" className="login-type-chip" />
                  </TableCell>
                  <TableCell>
                    <VerifiedChip verified={user.emailVerified} />
                  </TableCell>
                  <TableCell>
                    <Select
                      value={user.status}
                      size="small"
                      disabled={updatingStatusId === user.id}
                      onChange={(event) => handleStatusChange(user, event.target.value)}
                      sx={{
                        minWidth: 120,
                        borderRadius: '999px',
                        fontWeight: 800,
                        ...statusSelectStyles[user.status],
                      }}
                    >
                      {statusOptions.map((status) => (
                        <MenuItem key={status} value={status} sx={statusSelectStyles[status]}>
                          {status}
                        </MenuItem>
                      ))}
                    </Select>
                  </TableCell>
                  <TableCell>{formatDate(user.createdAt)}</TableCell>
                  <TableCell>
                    <Box className="users-action-row">
                      <Tooltip title="View">
                        <IconButton disabled={isDetailsLoading} sx={{ ...actionButtonSx, color: '#fff', background: 'linear-gradient(135deg,#ff8a3d,#ff7a1a)' }} onClick={() => handleView(user)}>
                          <Eye size={18} />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Edit">
                        <IconButton disabled={isDetailsLoading} sx={{ ...actionButtonSx, color: '#ff7a1a', background: '#fff4ea' }} onClick={() => handleEdit(user)}>
                          <Edit size={18} />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Delete">
                        <IconButton disabled={isDeleting || isDetailsLoading} sx={{ ...actionButtonSx, color: '#fff', background: '#2b211d' }} onClick={() => setDeleteTarget(user)}>
                          <Trash2 size={18} />
                        </IconButton>
                      </Tooltip>
                    </Box>
                  </TableCell>
                </TableRow>
              )) : (
                <TableRow>
                  <TableCell colSpan={headCells.length}>
                    <div className="users-empty-state">
                      <div className="users-empty-illustration">
                        <UsersIcon size={54} />
                      </div>
                      <h3>No Users Found</h3>
                      <p>Try adjusting the filters or create the first user account.</p>
                      <Button variant="contained" startIcon={<UserPlus size={18} />} onClick={handleCreate} disabled={isDetailsLoading}>
                        Create First User
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          )}
        </Table>
      </TableContainer>

      <TablePagination
        rowsPerPageOptions={[5, 10, 25]}
        component="div"
        count={filteredUsers.length}
        rowsPerPage={rowsPerPage}
        page={page}
        onPageChange={handleChangePage}
        onRowsPerPageChange={handleChangeRowsPerPage}
        className="users-pagination"
      />
    </Paper>
  );

  const renderFormView = () => {
    const isEdit = view === 'edit';

    return (
      <form className="user-form" onSubmit={handleFormSubmit}>
        <section className="user-form-hero">
          <div>
            <span>{isEdit ? <Edit size={22} /> : <UserPlus size={22} />}</span>
            <h1>{isEdit ? 'Edit User' : 'Create User'}</h1>
            <p>{isEdit ? 'Update this Street Buddy account.' : 'Create a new Street Buddy account.'}</p>
          </div>
          <Button variant="outlined" startIcon={<ArrowLeft size={18} />} onClick={handleBackToList}>
            Back To List
          </Button>
        </section>

        <UserFormSection icon={<ImageIcon size={24} />} title="Profile Information">
          <div className="user-upload-grid">
            <UploadCard
              title="Cover Photo"
              description="Drag and drop a wide image here"
              variant="cover"
              imageUrl={formData.coverImage}
              error={formErrors.coverImage}
              onUpload={handleImageUpload('coverImage')}
              onRemove={handleImageRemove('coverImage')}
            />
            <UploadCard
              title="Profile Photo"
              description="Drag and drop a square image here"
              variant="profile"
              imageUrl={formData.profileImage}
              error={formErrors.profileImage}
              onUpload={handleImageUpload('profileImage')}
              onRemove={handleImageRemove('profileImage')}
            />
          </div>
        </UserFormSection>

        <UserFormSection icon={<UserCircle size={24} />} title="Basic Information">
          <TextField name="username" label="Username" value={formData.username} onChange={handleFormChange} error={!!formErrors.username} helperText={formErrors.username || 'Unique public handle for this user.'} sx={textFieldSx} />
          <TextField name="fullName" label="Full Name" value={formData.fullName} onChange={handleFormChange} error={!!formErrors.fullName} helperText={formErrors.fullName || 'Use the legal or preferred display name.'} sx={textFieldSx} />
          <FormControl error={!!formErrors.gender} sx={textFieldSx}>
            <InputLabel>Gender</InputLabel>
            <Select name="gender" value={formData.gender} label="Gender" onChange={handleFormChange} sx={selectSx}>
              {genderOptions.map((option) => <MenuItem key={option} value={option}>{option}</MenuItem>)}
            </Select>
            <FormHelperText>{formErrors.gender || 'Optional profile demographic detail.'}</FormHelperText>
          </FormControl>
          <TextField name="birthdate" label="Birthdate" type="date" value={formData.birthdate} onChange={handleFormChange} error={!!formErrors.birthdate} helperText={formErrors.birthdate || 'Used for age-aware experiences.'} sx={textFieldSx} InputLabelProps={{ shrink: true }} />
          <TextField name="bio" label="Bio" value={formData.bio} onChange={handleFormChange} multiline minRows={5} error={!!formErrors.bio} helperText={formErrors.bio || 'Short profile note visible in account details.'} sx={{ ...textFieldSx, gridColumn: '1 / -1' }} />
        </UserFormSection>

        <UserFormSection icon={<Mail size={24} />} title="Contact Information">
          <TextField name="email" label="Email" value={formData.email} onChange={handleFormChange} error={!!formErrors.email} helperText={formErrors.email || 'A valid email address is required.'} sx={textFieldSx} />
          <TextField name="phone" label="Phone" value={formData.phone} onChange={handleFormChange} error={!!formErrors.phone} helperText={formErrors.phone || 'Include country code where possible.'} sx={textFieldSx} />
        </UserFormSection>

        <UserFormSection icon={<MapPin size={24} />} title="Location Information">
          <TextField name="state" label="State" placeholder="Enter State" value={formData.state} onChange={handleFormChange} error={!!formErrors.state} helperText={formErrors.state || 'Enter the user state.'} inputProps={{ maxLength: 120 }} sx={textFieldSx} />
          <TextField name="city" label="City" placeholder="Enter City" value={formData.city} onChange={handleFormChange} error={!!formErrors.city} helperText={formErrors.city || 'Enter the user city.'} inputProps={{ maxLength: 120 }} sx={textFieldSx} />
        </UserFormSection>

        <UserFormSection icon={<ShieldCheck size={24} />} title="Security">
          <TextField name="password" label="Password" type="password" value={formData.password} onChange={handleFormChange} error={!!formErrors.password} helperText={formErrors.password || (isEdit ? 'Leave blank to keep current password.' : 'Minimum 8 characters.')} sx={textFieldSx} />
          <TextField name="confirmPassword" label="Confirm Password" type="password" value={formData.confirmPassword} onChange={handleFormChange} error={!!formErrors.confirmPassword} helperText={formErrors.confirmPassword || 'Must match the password.'} sx={textFieldSx} />
          <FormControl error={!!formErrors.loginType} sx={textFieldSx}>
            <InputLabel>Login Type</InputLabel>
            <Select name="loginType" value={formData.loginType} label="Login Type" onChange={handleFormChange} sx={selectSx}>
              {loginTypeOptions.map((type) => <MenuItem key={type} value={type}>{type}</MenuItem>)}
            </Select>
            <FormHelperText>{formErrors.loginType || 'Choose how this account signs in.'}</FormHelperText>
          </FormControl>
          <FormControl error={!!formErrors.status} sx={textFieldSx}>
            <InputLabel>Status</InputLabel>
            <Select name="status" value={formData.status} label="Status" onChange={handleFormChange} sx={selectSx}>
              {statusOptions.map((status) => <MenuItem key={status} value={status}>{status}</MenuItem>)}
            </Select>
            <FormHelperText>{formErrors.status || 'Controls account moderation state.'}</FormHelperText>
          </FormControl>
          <div className="user-switch-row">
            <FormControlLabel control={<Switch name="emailVerified" checked={formData.emailVerified} onChange={handleFormChange} />} label="Email Verified" />
            <FormControlLabel control={<Switch name="active" checked={formData.active} onChange={handleFormChange} />} label="Active" />
          </div>
        </UserFormSection>

        <UserFormSection icon={<Tag size={24} />} title="Interests">
          <div className="user-interest-editor">
            <TextField
              value={interestInput}
              onChange={(event) => setInterestInput(event.target.value)}
              onKeyDown={handleInterestKeyDown}
              label="Add Interest"
              placeholder="Press Enter to add"
              error={!!formErrors.interests}
              helperText={formErrors.interests || 'Examples: Street Food, Cafe, Photography, Travel, Night Market.'}
              sx={textFieldSx}
            />
            <Button variant="contained" startIcon={<Plus size={17} />} onClick={() => addInterest()}>
              Add Interest
            </Button>
          </div>
          <div className="user-interest-suggestions">
            {interestSuggestions.map((interest) => (
              <button type="button" key={interest} onClick={() => addInterest(interest)}>
                {interest}
              </button>
            ))}
          </div>
          <div className="user-chip-list">
            {formData.interests.map((interest) => (
              <Chip key={interest} label={interest} onDelete={() => removeInterest(interest)} />
            ))}
          </div>
        </UserFormSection>

        <div className="user-form-action-bar">
          <Button variant="outlined" onClick={handleBackToList}>Cancel</Button>
          <Button type="submit" variant="contained" disabled={isSubmitting} startIcon={isEdit ? <Edit size={18} /> : <UserPlus size={18} />}>
            {isSubmitting ? 'Saving...' : (isEdit ? 'Update User' : 'Create User')}
          </Button>
        </div>
      </form>
    );
  };

  const renderDetailsView = () => {
    if (!selectedUser) return null;

    return (
      <div className="user-details">
        <Button className="users-back-button" variant="outlined" startIcon={<ArrowLeft size={18} />} onClick={handleBackToList}>
          Back To List
        </Button>

        <section className="user-details-hero">
          <div className="user-cover-banner">
            {selectedUser.coverImage && <img src={selectedUser.coverImage} alt={`${selectedUser.fullName} cover`} onError={(event) => { event.currentTarget.hidden = true; }} />}
            <div className="user-cover-overlay" />
          </div>
          <div className="user-profile-summary">
            <ProfileAvatar user={selectedUser} size={118} />
            <div>
              <h1>{selectedUser.fullName}</h1>
              <p>@{selectedUser.username}</p>
              <div className="user-summary-chips">
                <StatusChip status={selectedUser.status} />
                <VerifiedChip verified={selectedUser.emailVerified} />
                <ActiveChip active={selectedUser.active} />
              </div>
            </div>
          </div>
        </section>

        <div className="user-details-grid">
          <InfoCard title="Basic Information" icon={<UserCircle size={22} />}>
            <InfoItem icon={<UserCircle size={18} />} label="Username" value={`@${selectedUser.username}`} />
            <InfoItem icon={<UsersIcon size={18} />} label="Full Name" value={selectedUser.fullName} />
            <InfoItem icon={<ShieldCheck size={18} />} label="Gender" value={selectedUser.gender} />
            <InfoItem icon={<Calendar size={18} />} label="Birthdate" value={formatDate(selectedUser.birthdate)} />
            <div className="user-info-bio">
              <small>Bio</small>
              <p>{selectedUser.bio || 'N/A'}</p>
            </div>
          </InfoCard>

          <InfoCard title="Contact" icon={<Mail size={22} />}>
            <InfoItem icon={<Mail size={18} />} label="Email" value={selectedUser.email} />
            <InfoItem icon={<Phone size={18} />} label="Phone" value={selectedUser.phone} />
          </InfoCard>

          <InfoCard title="Location" icon={<MapPin size={22} />}>
            <InfoItem icon={<MapPin size={18} />} label="State" value={selectedUser.state} />
            <InfoItem icon={<MapPin size={18} />} label="City" value={selectedUser.city} />
          </InfoCard>

          <InfoCard title="Account" icon={<ShieldCheck size={22} />}>
            <InfoItem icon={<ShieldCheck size={18} />} label="Login Type" value={selectedUser.loginType} />
            <InfoItem icon={<BadgeCheck size={18} />} label="Email Verified" value={selectedUser.emailVerified ? 'Verified' : 'Not Verified'} />
            <InfoItem icon={<CheckCircle size={18} />} label="Status" value={selectedUser.status} />
            <InfoItem icon={<CheckCircle size={18} />} label="Active" value={selectedUser.active ? 'Active' : 'Inactive'} />
            <InfoItem icon={<Calendar size={18} />} label="Created Date" value={formatDate(selectedUser.createdAt)} />
            <InfoItem icon={<Calendar size={18} />} label="Updated Date" value={formatDate(selectedUser.updatedAt)} />
            <InfoItem icon={<Clock size={18} />} label="Last Login" value={selectedUser.lastLogin} />
          </InfoCard>

          <InfoCard title="Interests" icon={<Tag size={22} />}>
            <div className="user-chip-list">
              {selectedUser.interests.map((interest) => (
                <Chip key={interest} label={interest} />
              ))}
            </div>
          </InfoCard>
        </div>
      </div>
    );
  };

  return (
    <section className="users-page">
      <Snackbar open={Boolean(successMessage)} autoHideDuration={4000} onClose={() => setSuccessMessage('')} anchorOrigin={{ vertical: 'top', horizontal: 'right' }}>
        <Alert severity="success" variant="filled" onClose={() => setSuccessMessage('')}>{successMessage}</Alert>
      </Snackbar>
      <Snackbar open={Boolean(errorMessage)} autoHideDuration={6000} onClose={() => setErrorMessage('')} anchorOrigin={{ vertical: 'top', horizontal: 'right' }}>
        <Alert severity="error" variant="filled" onClose={() => setErrorMessage('')}>{errorMessage}</Alert>
      </Snackbar>
      {view === 'list' && renderListView()}
      {(view === 'create' || view === 'edit') && renderFormView()}
      {view === 'details' && renderDetailsView()}

      <Dialog open={Boolean(deleteTarget)} onClose={() => setDeleteTarget(null)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontWeight: 900 }}>Delete User?</DialogTitle>
        <DialogContent>
          <DialogContentText>
            This action will remove the user from the active list.
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5 }}>
          <Button onClick={() => setDeleteTarget(null)} disabled={isDeleting} sx={{ borderRadius: '12px', color: '#2b211d' }}>
            Cancel
          </Button>
          <Button onClick={confirmDelete} disabled={isDeleting} color="error" variant="contained" startIcon={<Trash2 size={17} />} sx={{ borderRadius: '12px' }}>
            {isDeleting ? 'Deleting...' : 'Delete'}
          </Button>
        </DialogActions>
      </Dialog>
    </section>
  );
}

export default Users;
