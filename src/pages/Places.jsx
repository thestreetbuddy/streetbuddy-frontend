
import { useEffect, useState, useCallback, useMemo, useRef } from 'react';
import {
  Box, Paper, TableContainer, Table, TableHead, TableRow, TableCell, TableBody, TableSortLabel,
  Toolbar, Typography, TextField, InputAdornment, Tooltip, IconButton, Chip, Rating,
  TablePagination, Skeleton, Switch, FormControlLabel, Grid, Divider, Select as MuiSelect,
  MenuItem, FormControl, InputLabel, FormHelperText, Button, Dialog, DialogTitle,
  DialogContent, DialogContentText, DialogActions
} from '@mui/material';
import {
  Search, Eye, Edit, Trash2, UploadCloud, X, MapPinned, Link2, MapPin, LocateFixed, Phone,
  ArrowLeft, Image as ImageIcon, Video as VideoIcon, Star, Calendar, Tag, Map, CheckCircle,
  Clock, Plus, ChevronLeft, ChevronRight, Navigation, BadgeCheck
} from 'lucide-react';
import { useDropzone } from 'react-dropzone';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { TimePicker } from '@mui/x-date-pickers/TimePicker';
import dayjs from 'dayjs';
import Select from 'react-select';

import { getCities } from '../api/cityApi';
import { getCategories } from '../api/categoryApi';
import { createPlace, getPlace, getPlaces, deletePlace, updatePlace } from '../api/placeApi';

import '../styles/places.css';
import '../styles/crud.css';
import CircularProgress from "@mui/material/CircularProgress";
import { ShieldCheck, IndianRupee } from "lucide-react";

const emptyForm = {
  name: '', city_id: '', category_id: '', description: '', address: '',
  location: '', latitude: '', longitude: '', contact_number: '',
  opening_time: null, closing_time: null, safety_rating: '', cost_rating: '',
  featured: false, active: true, status: 'Pending', media_files: [],
};

const backendToFormField = {
  shop_name: 'name',
  city_id: 'city_id',
  category_id: 'category_id',
  description: 'description',
  location: 'location',
  address: 'address',
  latitude: 'latitude',
  longitude: 'longitude',
  contact_number: 'contact_number',
  opening_time: 'opening_time',
  closing_time: 'closing_time',
  safety_rating: 'safety_rating',
  cost_rating: 'cost_rating',
  is_featured: 'featured',
  is_active: 'active',
  status: 'status',
  media: 'media_files',
};

const apiStatusMessages = {
  400: 'The submitted place data is invalid.',
  401: 'Your session has expired. Please sign in again.',
  403: 'You do not have permission to save this place.',
  404: 'The place could not be found.',
  409: 'A place with the same details already exists.',
  422: 'Please correct the highlighted fields.',
  500: 'The server could not save the place. Please try again.',
};

const isBlank = (value) => value === null || value === undefined || String(value).trim() === '';

const toBoolean = (value) => value === true || value === 1 || value === '1';

const parsePlaceTime = (value) => {
  if (!value) return null;
  if (dayjs.isDayjs(value)) return value.isValid() ? value : null;

  const timeMatch = String(value).match(/^([01]?\d|2[0-3]):([0-5]\d)(?::([0-5]\d)(?:\.\d+)?)?$/);
  if (timeMatch) {
    return dayjs()
      .hour(Number(timeMatch[1]))
      .minute(Number(timeMatch[2]))
      .second(Number(timeMatch[3] || 0))
      .millisecond(0);
  }

  const parsedValue = dayjs(value);
  return parsedValue.isValid() ? parsedValue : null;
};

const formatPlaceTime = (value) => {
  const parsedValue = parsePlaceTime(value);
  return parsedValue ? parsedValue.format('HH:mm:ss') : '';
};

const buildPlaceFormData = (formData) => {
  const payload = new FormData();

  payload.append('shop_name', formData.name.trim());
  payload.append('city_id', Number(formData.city_id));
  payload.append('category_id', Number(formData.category_id));
  payload.append('description', formData.description.trim());
  payload.append('location', formData.location.trim());
  payload.append('address', formData.address.trim());
  payload.append('latitude', Number(formData.latitude));
  payload.append('longitude', Number(formData.longitude));
  payload.append('contact_number', formData.contact_number.trim());
  payload.append('opening_time', formatPlaceTime(formData.opening_time));
  payload.append('closing_time', formatPlaceTime(formData.closing_time));
  payload.append('safety_rating', Number(formData.safety_rating));
  payload.append('cost_rating', Number(formData.cost_rating));
  payload.append('is_featured', formData.featured ? 1 : 0);
  payload.append('is_active', formData.active ? 1 : 0);
  payload.append('status', formData.status);

  formData.media_files.forEach((file) => payload.append('media', file));

  return payload;
};

const validatePlaceForm = (formData, isCreate) => {
  const errors = {};

  if (isBlank(formData.name)) errors.name = 'Place Name is required.';
  if (isBlank(formData.city_id)) errors.city_id = 'City is required.';
  if (isBlank(formData.category_id)) errors.category_id = 'Category is required.';
  if (isBlank(formData.address)) errors.address = 'Full Address is required.';
  if (isBlank(formData.location)) errors.location = 'Location is required.';
  if (isBlank(formData.contact_number)) errors.contact_number = 'Contact Number is required.';
  if (!parsePlaceTime(formData.opening_time)) errors.opening_time = 'A valid Opening Time is required.';
  if (!parsePlaceTime(formData.closing_time)) errors.closing_time = 'A valid Closing Time is required.';

  if (!isBlank(formData.city_id) && (!Number.isFinite(Number(formData.city_id)) || Number(formData.city_id) <= 0)) {
    errors.city_id = 'Select a valid city.';
  }
  if (!isBlank(formData.category_id) && (!Number.isFinite(Number(formData.category_id)) || Number(formData.category_id) <= 0)) {
    errors.category_id = 'Select a valid category.';
  }
  if (!isBlank(formData.latitude) && (!Number.isFinite(Number(formData.latitude)) || Number(formData.latitude) < -90 || Number(formData.latitude) > 90)) {
    errors.latitude = 'Latitude must be between -90 and 90.';
  }
  if (!isBlank(formData.longitude) && (!Number.isFinite(Number(formData.longitude)) || Number(formData.longitude) < -180 || Number(formData.longitude) > 180)) {
    errors.longitude = 'Longitude must be between -180 and 180.';
  }
  if (!isBlank(formData.safety_rating) && ![1, 2, 3, 4, 5].includes(Number(formData.safety_rating))) {
    errors.safety_rating = 'Select a valid safety rating.';
  }
  if (!isBlank(formData.cost_rating) && ![1, 2, 3, 4, 5].includes(Number(formData.cost_rating))) {
    errors.cost_rating = 'Select a valid cost rating.';
  }
  if (isCreate && formData.media_files.length === 0) {
    errors.media_files = 'At least one photo or video is required.';
  }

  return errors;
};

const normalizeApiMessages = (value) => {
  if (typeof value === 'string') return [value];
  if (Array.isArray(value)) return value.flatMap(normalizeApiMessages);
  if (value && typeof value === 'object') {
    if (value.constraints) return normalizeApiMessages(value.constraints);
    return Object.values(value).flatMap(normalizeApiMessages);
  }
  return [];
};

const getFieldFromMessage = (message) => Object.entries(backendToFormField)
  .find(([backendField]) => new RegExp(`\\b${backendField}\\b`, 'i').test(message))?.[1];

const getPlaceApiError = (error) => {
  const responseData = error.response?.data;
  const status = error.response?.status;
  const fieldErrors = {};
  const errorContainers = [
    responseData?.errors,
    responseData?.validationErrors,
    responseData?.data?.errors,
    responseData?.message && !Array.isArray(responseData.message) && typeof responseData.message === 'object'
      ? responseData.message
      : null,
  ];

  errorContainers.forEach((container) => {
    if (!container || Array.isArray(container) || typeof container !== 'object') return;

    Object.entries(container).forEach(([backendField, messages]) => {
      const formField = backendToFormField[backendField] || backendField;
      const fieldMessages = normalizeApiMessages(messages);
      if (fieldMessages.length > 0) fieldErrors[formField] = fieldMessages.join(' ');
    });
  });

  const messages = normalizeApiMessages(responseData?.message);
  messages.forEach((message) => {
    const formField = getFieldFromMessage(message);
    if (formField && !fieldErrors[formField]) fieldErrors[formField] = message;
  });

  return {
    fieldErrors,
    message: [...new Set(messages)].join(' ') || apiStatusMessages[status] || 'Unable to save place.',
  };
};

const getPlaceResponseData = (response) => response?.data?.data?.data;

const getRelationName = (relation) => {
  if (relation && typeof relation === 'object') return relation.name || '-';
  return relation || '-';
};

const getMediaType = (media) => media?.media_type || media?.type || '';

const getMediaUrl = (media) => media?.media_url || media?.url || '';

const getPlaceMedia = (place) => Array.isArray(place?.media) ? place.media : [];

const RatingCircle = ({ value = 0, type = "safety" }) => {
  const percentage = (Number(value) / 5) * 100;

  const color = type === "safety" ? "#1976d2" : "#4CAF50";

  const Icon = type === "safety" ? ShieldCheck : IndianRupee;

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 0.5,
      }}
    >
      <Box sx={{ position: "relative", display: "inline-flex" }}>
        <CircularProgress
          variant="determinate"
          value={100}
          size={58}
          thickness={4}
          sx={{ color: "#ececec" }}
        />

        <CircularProgress
          variant="determinate"
          value={percentage}
          size={58}
          thickness={4}
          sx={{
            color,
            position: "absolute",
            left: 0,
          }}
        />

        <Box
          sx={{
            position: "absolute",
            inset: 0,
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <Icon size={22} color={color} />
        </Box>
      </Box>

      <Typography
        sx={{
          fontSize: 12,
          fontWeight: 700,
          color,
        }}
      >
        {value}/5
      </Typography>
    </Box>
  );
};

const DetailInfoItem = ({ icon, label, children }) => (
  <div className="detail-info-item">
    <div className="detail-info-icon">{icon}</div>
    <div className="detail-info-content">
      <span>{label}</span>
      <div>{children}</div>
    </div>
  </div>
);

const customSelectStyles = {
  // Styles from original file...
  clearIndicator: (p) => ({ ...p, color: '#ff8c42', '&:hover': { color: '#f97316' } }),
  control: (p, s) => ({ ...p, minHeight: "54px", height: "54px", borderRadius: "10px", background: "#fff", border: s.isFocused ? "1px solid #ff8c42" : "1px solid #d9dee8", boxShadow: "none", "&:hover": { borderColor: "#ff8c42" } }),
  valueContainer: (p) => ({ ...p, height: "54px", padding: "0 14px", display: "flex", alignItems: "center" }),
  indicatorsContainer: (p) => ({ ...p, height: "54px" }),
  singleValue: (p) => ({ ...p, display: "flex", alignItems: "center", color: "#111827", fontWeight: 500 }),
  placeholder: (p) => ({ ...p, color: '#8d98a8' }),
  menuPortal: (b) => ({ ...b, zIndex: 9999 }),
  menu: (p) => ({ ...p, borderRadius: '20px', overflow: 'hidden', border: '1px solid #ffe0cc', boxShadow: '0 20px 45px rgba(255,140,66,.15)' }),
  indicatorSeparator: () => ({ display: 'none' }),
  dropdownIndicator: (p) => ({ ...p, color: '#ff8c42' }),
  input: (p) => ({ ...p, margin: 0, padding: 0 }),
};


// Helper functions for sorting
function descendingComparator(a, b, orderBy) {
  if (b[orderBy] < a[orderBy]) return -1;
  if (b[orderBy] > a[orderBy]) return 1;
  return 0;
}

function getComparator(order, orderBy) {
  return order === 'desc'
    ? (a, b) => descendingComparator(a, b, orderBy)
    : (a, b) => -descendingComparator(a, b, orderBy);
}

function stableSort(array, comparator) {
  const stabilizedThis = array.map((el, index) => [el, index]);
  stabilizedThis.sort((a, b) => {
    const order = comparator(a[0], b[0]);
    if (order !== 0) return order;
    return a[1] - b[1];
  });
  return stabilizedThis.map((el) => el[0]);
}

const headCells = [
  { id: 'id', numeric: false, disablePadding: true, label: 'ID' },
  { id: 'image', numeric: false, disablePadding: true, label: 'Image' },
  { id: 'name', numeric: false, disablePadding: true, label: 'Shop Name' },
  { id: 'city', numeric: false, disablePadding: false, label: 'City' },
  { id: 'category', numeric: false, disablePadding: false, label: 'Category' },
  // { id: 'contact_number', numeric: false, disablePadding: false, label: 'Contact' },
  { id: 'safety_rating', numeric: true, disablePadding: false, label: 'Safety' },
  { id: 'cost_rating', numeric: true, disablePadding: false, label: 'Cost' },
  { id: 'is_deleted', numeric: false, disablePadding: false, label: 'Deleted' },
  // { id: 'status', numeric: false, disablePadding: false, label: 'Status' },
  { id: 'active', numeric: false, disablePadding: false, label: 'Active' },
  { id: 'created_at', numeric: false, disablePadding: false, label: 'Created Date' },
  { id: 'actions', numeric: false, disablePadding: false, label: 'Actions' },
];

function EnhancedTableHead(props) {
  const { order, orderBy, onRequestSort } = props;
  const createSortHandler = (property) => (event) => {
    onRequestSort(event, property);
  };

  return (
    <TableHead sx={{
      '& .MuiTableCell-root': {
        backgroundColor: '#f9fafb',
        borderBottom: '1px solid #e5e7eb',
      }
    }}>
      <TableRow>

        {headCells.map((headCell) => (
          <TableCell
            key={headCell.id}
            align={headCell.numeric ? 'right' : 'left'}
            padding={headCell.disablePadding ? 'none' : 'normal'}
            sortDirection={orderBy === headCell.id ? order : false}
            // sx={{ fontWeight: '600', color: '#4b5563' }}
            sx={{
              fontWeight: 800,
              fontSize: "15px",
              color: "#1f2937",
              background: "#fafafa"
            }}
          >
            {headCell.id === 'actions' ? headCell.label : (
              <TableSortLabel
                active={orderBy === headCell.id}
                direction={orderBy === headCell.id ? order : 'asc'}
                onClick={createSortHandler(headCell.id)}
              >
                {headCell.label}
              </TableSortLabel>
            )}
          </TableCell>
        ))}
      </TableRow>
    </TableHead>
  );
}

function Places() {
  const [view, setView] = useState('table'); // 'table', 'details', 'create', 'edit'
  const [places, setPlaces] = useState([]);
  const [selectedPlace, setSelectedPlace] = useState(null);
  const [loading, setLoading] = useState(true);
  const [apiError, setApiError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Table state
  const [order, setOrder] = useState('desc');
  const [orderBy, setOrderBy] = useState('created_at');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [searchTerm, setSearchTerm] = useState('');

  // Filter states
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterFeatured, setFilterFeatured] = useState('all');
  const [filterActive, setFilterActive] = useState('all');

  // Form state
  const [formData, setFormData] = useState(emptyForm);
  const [cityOptions, setCityOptions] = useState([]);
  const [categoryOptions, setCategoryOptions] = useState([]);
  const [isFormLoading, setIsFormLoading] = useState(false);
  const [validationErrors, setValidationErrors] = useState({});
  const [search, setSearch] = useState("");
  const [existingMedia, setExistingMedia] = useState([]);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [lightboxMedia, setLightboxMedia] = useState(null);
  const [isDetailsLoading, setIsDetailsLoading] = useState(false);
  const mediaGalleryRef = useRef(null);
  const uploadedMediaRef = useRef([]);

  const loadPlaces = async () => {
    setLoading(true);
    try {
      const response = await getPlaces();
      const placesData = getPlaceResponseData(response);
      setPlaces(Array.isArray(placesData) ? placesData : []);
    } catch (err) {
      setApiError(err.response?.data?.message || 'Unable to load places.');
    } finally {
      setLoading(false);
    }
  };

  const loadDropdownData = async () => {
    try {
      const [citiesRes, categoriesRes] = await Promise.all([getCities(), getCategories()]);
      const citiesData = citiesRes.data?.data?.data || citiesRes.data?.data || [];
      const categoriesData = categoriesRes.data?.data?.data || categoriesRes.data?.data || [];
      setCityOptions(citiesData);
      setCategoryOptions(categoriesData);
    } catch (err) {
      console.error('Failed to load dropdown data', err);
      setApiError('Failed to load cities or categories for dropdowns.');
    }
  };

  useEffect(() => {
    loadPlaces();
    loadDropdownData();
  }, []);

  const handleRequestSort = (event, property) => {
    const isAsc = orderBy === property && order === 'asc';
    setOrder(isAsc ? 'desc' : 'asc');
    setOrderBy(property);
  };

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleSearchChange = (event) => {
    const nextSearch = event.target.value;
    setSearch(nextSearch);
    setSearchTerm(nextSearch);
    setPage(0);
  };

  const handleViewDetails = async (place) => {
    setApiError('');
    setSuccessMsg('');
    setSelectedPlace(null);
    setView('details');
    setIsDetailsLoading(true);

    try {
      const response = await getPlace(place.id);
      const placeDetails = getPlaceResponseData(response);
      if (!placeDetails || typeof placeDetails !== 'object') {
        throw new Error('Invalid place details response.');
      }
      setSelectedPlace(placeDetails);
    } catch (err) {
      setApiError(normalizeApiMessages(err.response?.data?.message).join(' ') || 'Unable to load place details.');
      setView('table');
    } finally {
      setIsDetailsLoading(false);
    }
  };

  const handleDelete = (place) => {
    setApiError('');
    setSuccessMsg('');
    setDeleteTarget(place);
  };

  const closeDeleteDialog = () => {
    if (!isDeleting) setDeleteTarget(null);
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;

    setIsDeleting(true);
    setApiError('');
    try {
      await deletePlace(deleteTarget.id);
      setDeleteTarget(null);
      await loadPlaces();
      setSuccessMsg('Place deleted successfully.');
    } catch (err) {
      setApiError(normalizeApiMessages(err.response?.data?.message).join(' ') || 'Failed to delete place.');
    } finally {
      setIsDeleting(false);
    }
  };


  // const filteredPlaces = useMemo(() => {
  //   return places
  //     .filter(place => {
  //       const searchLower = searchTerm.toLowerCase();
  //       return (
  //         place.name.toLowerCase().includes(searchLower) ||
  //         place.city.name.toLowerCase().includes(searchLower) ||
  //         place.category.name.toLowerCase().includes(searchLower)
  //       );
  //     })
  //     .filter(place => filterStatus === 'all' || place.status === filterStatus)
  //     .filter(place => filterFeatured === 'all' || place.featured.toString() === filterFeatured)
  //     .filter(place => filterActive === 'all' || place.active.toString() === filterActive);
  // }, 

  const filteredPlaces = useMemo(() => {
    const searchText = searchTerm.trim().toLowerCase();

    return (places || [])
      .filter((place) => (
        String(place?.shop_name || '').toLowerCase().includes(searchText) ||
        String(getRelationName(place?.city)).toLowerCase().includes(searchText) ||
        String(getRelationName(place?.category)).toLowerCase().includes(searchText)
      ))
      .filter((place) => filterStatus === 'all' || String(place?.status || '').toLowerCase() === filterStatus)
      .filter((place) => filterFeatured === 'all' || String(toBoolean(place?.is_featured)) === filterFeatured)
      .filter((place) => filterActive === 'all' || String(toBoolean(place?.is_active)) === filterActive);
  }, [places, searchTerm, filterStatus, filterFeatured, filterActive]);

  const visibleRows = useMemo(() => {
    return stableSort(filteredPlaces, getComparator(order, orderBy))
      .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);
  }, [filteredPlaces, order, orderBy, page, rowsPerPage]);

  const filterSelectSx = {
    minWidth: 165,

    "& .MuiOutlinedInput-root": {
      height: 52,
      borderRadius: "14px",
      background: "#fff",

      "& fieldset": {
        borderColor: "#e5e7eb",
      },

      "&:hover fieldset": {
        borderColor: "#ff8a3d",
      },

      "&.Mui-focused fieldset": {
        borderColor: "#ff8a3d",
        borderWidth: "2px",
      },
    },

    "& .MuiSelect-select": {
      display: "flex",
      alignItems: "center",
      fontWeight: 600,
      fontSize: 14,
    },
  };

  const getStatusChip = (status) => {
    const colors = { approved: 'success', pending: 'warning', rejected: 'error' };
    const normalizedStatus = String(status || '').toLowerCase();
    return <Chip label={status || 'Unknown'} color={colors[normalizedStatus] || 'default'} size="small" sx={{ textTransform: 'capitalize' }} />;
  };

  const getFeaturedChip = (isFeatured) => {
    return isFeatured ?
      <Chip label="Featured" color="success" variant="outlined" size="small" /> :
      <Chip label="Normal" color="default" size="small" />;
  };

  const getActiveChip = (isActive) => {
    return isActive ?
      <Chip label="Active" color="success" size="small" /> :
      <Chip label="Inactive" color="error" size="small" />;
  };

  const textFieldStyle = {
    "& .MuiOutlinedInput-root": {
      minHeight: 54,
      borderRadius: "10px",
      background: "#fff",

      "& fieldset": {
        borderColor: "#d9dee8",
      },

      "&:hover fieldset": {
        borderColor: "#ff8a3d",
      },

      "&.Mui-focused fieldset": {
        borderColor: "#ff8a3d",
        borderWidth: 2,
      },
    },
    "& .MuiInputBase-input": {
      fontSize: 14,
      fontWeight: 500,
      color: "#111827",
    },
    "& .MuiInputBase-input::placeholder": {
      color: "#8d98a8",
      opacity: 1,
    },
  };

  const labelStyle = {
    mb: 1.2,
    fontSize: 13,
    fontWeight: 700,
    color: "#1f2937",
  };

  const formatDate = (dateString) => {
    const parsedDate = dayjs(dateString);
    return dateString && parsedDate.isValid() ? parsedDate.format('DD MMM YYYY') : '-';
  };

  const formatDisplayTime = (timeValue) => {
    const parsedTime = parsePlaceTime(timeValue);
    return parsedTime ? parsedTime.format('h:mm A') : '-';
  };

  const scrollMediaGallery = (direction) => {
    const gallery = mediaGalleryRef.current;
    if (!gallery) return;
    gallery.scrollBy({ left: direction * Math.min(gallery.clientWidth * 0.8, 760), behavior: 'smooth' });
  };

  // FORM LOGIC
  const onDrop = useCallback((acceptedFiles) => {
    const newFiles = acceptedFiles.map(file => Object.assign(file, { preview: URL.createObjectURL(file) }));
    setFormData(prev => ({ ...prev, media_files: [...prev.media_files, ...newFiles] }));
    setValidationErrors(prev => ({ ...prev, media_files: '' }));
  }, []);

  const { getRootProps, getInputProps } = useDropzone({
    onDrop,
    accept: { 'image/*': ['.jpeg', '.png', '.webp'], 'video/*': ['.mp4', '.mov', '.avi', '.mkv', '.webm'] },
  });

  const removeFile = (file) => (e) => {
    e.stopPropagation();
    URL.revokeObjectURL(file.preview);
    const newFiles = [...formData.media_files];
    newFiles.splice(newFiles.indexOf(file), 1);
    setFormData(prev => ({ ...prev, media_files: newFiles }));
  };

  const removeExistingMedia = (media) => (event) => {
    event.stopPropagation();
    setExistingMedia(prev => prev.filter(item => item.id !== media.id));
  };

  const existingMediaPreviews = existingMedia.map((media, index) => {
    const mediaType = getMediaType(media);
    const mediaUrl = getMediaUrl(media);

    return (
      <div className="preview-item" key={`existing-${media.id || index}`}>
        <div className="preview-thumbnail">
          {mediaType === 'video'
            ? <video src={mediaUrl} controls preload="metadata" />
            : <img src={mediaUrl} alt={`Existing media ${index + 1}`} />}
        </div>
        <span className="preview-type">Existing {mediaType || 'file'}</span>
        <button type="button" className="preview-remove-button" aria-label="Remove existing media" onClick={removeExistingMedia(media)}><Trash2 size={14} /></button>
      </div>
    );
  });

  const newMediaPreviews = formData.media_files.map((file) => (
    <div className="preview-item" key={file.name || file.path}>
      <div className="preview-thumbnail">
        {file.type.startsWith('image/') ? <img src={file.preview} alt={file.name} /> : <video src={file.preview} controls preload="metadata" />}
      </div>
      <span className="preview-type">New {file.type.startsWith('image/') ? 'image' : 'video'}</span>
      <button type="button" className="preview-remove-button" aria-label="Remove uploaded media" onClick={removeFile(file)}><X size={14} /></button>
    </div>
  ));

  useEffect(() => {
    uploadedMediaRef.current = formData.media_files;
  }, [formData.media_files]);

  useEffect(() => () => {
    uploadedMediaRef.current.forEach(file => URL.revokeObjectURL(file.preview));
  }, []);

  const handleFormChange = (event) => {
    const { name, value, type, checked } = event.target;
    setFormData(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
    if (validationErrors[name]) setValidationErrors(prev => ({ ...prev, [name]: '' }));
  };

  const handleSelectChange = (name, option) => {
    setFormData(prev => ({ ...prev, [name]: option ? option.value : '' }));
    if (validationErrors[name]) setValidationErrors(prev => ({ ...prev, [name]: '' }));
  };

  const handleTimeChange = (name, value) => {
    setFormData(prev => ({ ...prev, [name]: value }));
    if (validationErrors[name]) setValidationErrors(prev => ({ ...prev, [name]: '' }));
  };

  const resetForm = () => {
    formData.media_files.forEach(file => URL.revokeObjectURL(file.preview));
    setFormData(emptyForm);
    setExistingMedia([]);
    setValidationErrors({});
  };

  const handleCreateNew = () => {
    resetForm();
    setApiError('');
    setSuccessMsg('');
    setView('create');
  }

  const handleEdit = async (place) => {
    setApiError('');
    setSuccessMsg('');
    setIsDetailsLoading(true);

    try {
      const response = await getPlace(place.id);
      const placeDetails = getPlaceResponseData(response);
      if (!placeDetails || typeof placeDetails !== 'object') {
        throw new Error('Invalid place details response.');
      }

      const cityId = placeDetails.city_id ?? placeDetails.city?.id ?? '';
      const categoryId = placeDetails.category_id ?? placeDetails.category?.id ?? '';

      setSelectedPlace(placeDetails);
      setExistingMedia(getPlaceMedia(placeDetails));
      setFormData({
        name: placeDetails.shop_name || placeDetails.name || '',
        city_id: isBlank(cityId) ? '' : Number(cityId),
        category_id: isBlank(categoryId) ? '' : Number(categoryId),
        description: placeDetails.description || '',
        address: placeDetails.address || '',
        location: placeDetails.location || '',
        latitude: placeDetails.latitude ?? '',
        longitude: placeDetails.longitude ?? '',
        contact_number: placeDetails.contact_number || '',
        opening_time: parsePlaceTime(placeDetails.opening_time),
        closing_time: parsePlaceTime(placeDetails.closing_time),
        safety_rating: placeDetails.safety_rating ?? '',
        cost_rating: placeDetails.cost_rating ?? '',
        featured: toBoolean(placeDetails.is_featured ?? placeDetails.featured),
        active: toBoolean(placeDetails.is_active ?? placeDetails.active),
        status: placeDetails.status || 'Pending',
        media_files: [],
      });
      setValidationErrors({});
      setView('edit');
    } catch (err) {
      setApiError(normalizeApiMessages(err.response?.data?.message).join(' ') || 'Unable to load place for editing.');
    } finally {
      setIsDetailsLoading(false);
    }
  };

  const handleBackToList = () => {
    setView('table');
    setSelectedPlace(null);
    setExistingMedia([]);
    setLightboxMedia(null);
    setApiError('');
    setSuccessMsg('');
  };

  const handleFormSubmit = async (event) => {
    event.preventDefault();
    setApiError('');
    setSuccessMsg('');

    const errors = validatePlaceForm(formData, view === 'create');

    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors);
      return;
    }

    setValidationErrors({});
    setIsFormLoading(true);

    try {
      const submissionData = buildPlaceFormData(formData);
      const successMessage = view === 'create'
        ? 'Place created successfully.'
        : 'Place updated successfully.';

      if (view === 'create') {
        await createPlace(submissionData);
      } else {
        await updatePlace(selectedPlace.id, submissionData);
      }

      resetForm();
      setSelectedPlace(null);
      setView('table');
      await loadPlaces();
      setSuccessMsg(successMessage);
    } catch (err) {
      console.error('Submission Error:', err.response?.data);
      const apiErrorDetails = getPlaceApiError(err);
      setValidationErrors(prev => ({ ...prev, ...apiErrorDetails.fieldErrors }));
      setApiError(apiErrorDetails.message);
    } finally {
      setIsFormLoading(false);
    }
  };

  if (loading) {
    return (
      <Box sx={{ p: 3 }}>
        <Skeleton variant="text" width={200} height={40} />
        <Skeleton variant="rectangular" width="100%" height={80} sx={{ my: 2 }} />
        <Skeleton variant="rectangular" width="100%" height={400} />
      </Box>
    );
  }

  // TABLE VIEW
  const renderTableView = () => (
    <Paper sx={{ width: '100%', mb: 2, borderRadius: '16px', boxShadow: '0 8px 32px rgba(0,0,0,0.05)' }}>
      {/* <Toolbar
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          padding: "24px 28px",
          borderBottom: "1px solid #f1f5f9",
          background: "#fff",
        }}
      >
        <div>
          <Toolbar
            sx={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              padding: "24px 28px",
              borderBottom: "1px solid #f1f5f9",
              background: "#fff",
            }}
          >
            <Box>
              <Typography
                variant="h5"
                sx={{
                  fontWeight: 800,
                  color: "#1f2937",
                }}
              >
                📍 Places
              </Typography>

              <Typography
                sx={{
                  color: "#6b7280",
                  fontSize: 14,
                  mt: .5,
                }}
              >
                Manage all street food places across all cities.
              </Typography>
            </Box>

            <Button
              variant="contained"
              startIcon={<Plus size={18} />}
              onClick={handleCreateNew}
              sx={{
                borderRadius: "14px",
                px: 3,
                py: 1.3,
                textTransform: "none",
                fontWeight: 700,
                background:
                  "linear-gradient(135deg,#ff9f43,#ff6b35)",

                boxShadow:
                  "0 10px 20px rgba(255,120,40,.30)",

                "&:hover": {
                  background:
                    "linear-gradient(135deg,#ff8c1a,#ff6b35)",
                },
              }}
            >
              Create New Place
            </Button>
          </Toolbar>
        </div>
        <Button variant="contained" color="primary" onClick={handleCreateNew} sx={{ borderRadius: '12px', textTransform: 'none' }}>
          Create New Place
        </Button>
      </Toolbar> */}

      <Toolbar
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          padding: "24px 28px",
          borderBottom: "1px solid #f1f5f9",
          background: "#fff",
        }}
      >
        <Box>
          <Typography
            variant="h4"
            sx={{
              fontWeight: 800,
              color: "#1f2937",
              mb: 0.5,
            }}
          >
            📍 Places
          </Typography>

          <Typography
            sx={{
              color: "#6b7280",
              fontSize: 15,
            }}
          >
            Manage all street food places across all cities.
          </Typography>
        </Box>

        <Button
          variant="contained"
          startIcon={<Plus size={18} />}
          onClick={handleCreateNew}
          sx={{
            borderRadius: "14px",
            px: 3,
            py: 1.3,
            textTransform: "none",
            fontWeight: 700,
            background:
              "linear-gradient(135deg,#ff9f43,#ff6b35)",
            boxShadow:
              "0 10px 20px rgba(255,120,40,.30)",

            "&:hover": {
              background:
                "linear-gradient(135deg,#ff8c1a,#ff6b35)",
            },
          }}
        >
          Create New Place
        </Button>
      </Toolbar>

      <Box
        sx={{
          display: "flex",
          gap: 2,
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          p: 2,
          borderRadius: "16px",
          background: "#fafafa",
          border: "1px solid #f0f0f0",
          mb: 2,
        }}
      >
        {/* <TextField
          variant="outlined"
          placeholder="Search by Shop Name, City, Category..."
          onChange={handleSearchChange}
          sx={{ flexGrow: 1, minWidth: '300px' }}
          InputProps={{
            startAdornment: <InputAdornment position="start"><Search size={20} /></InputAdornment>,
            sx: { borderRadius: '12px' }
          }}
        /> */}

        <TextField
          placeholder="🔍 Search by Shop Name, City, Category..."
          variant="outlined"
          value={search}
          onChange={handleSearchChange}
          sx={{
            flex: 1,
            minWidth: 420,

            "& .MuiOutlinedInput-root": {
              height: 52,
              borderRadius: "14px",
              background: "#fff",
              fontSize: "15px",

              "& fieldset": {
                borderColor: "#e5e7eb",
              },

              "&:hover fieldset": {
                borderColor: "#ff8a3d",
              },

              "&.Mui-focused fieldset": {
                borderColor: "#ff8a3d",
                borderWidth: "2px",
              },
            },
          }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <Search size={18} color="#ff8a3d" />
              </InputAdornment>
            ),
          }}
        />
        <FormControl sx={filterSelectSx}>
          <InputLabel>Status</InputLabel>

          <MuiSelect
            value={filterStatus}
            label="Status"
            onChange={(e) => {
              setFilterStatus(e.target.value);
              setPage(0);
            }}
          >
            <MenuItem value="all">🟡 All Status</MenuItem>
            <MenuItem value="approved">🟢 Approved</MenuItem>
            <MenuItem value="pending">🟠 Pending</MenuItem>
            <MenuItem value="rejected">🔴 Rejected</MenuItem>
          </MuiSelect>
        </FormControl>
        <FormControl sx={filterSelectSx}>
          <InputLabel>Featured</InputLabel>

          <MuiSelect
            value={filterFeatured}
            label="Featured"
            onChange={(e) => {
              setFilterFeatured(e.target.value);
              setPage(0);
            }}
          >
            <MenuItem value="all">⭐ All</MenuItem>
            <MenuItem value="true">⭐ Featured</MenuItem>
            <MenuItem value="false">⚪ Normal</MenuItem>
          </MuiSelect>
        </FormControl>

        {/* <FormControl sx={{ minWidth: 150 }} size="small">
          <InputLabel>Active</InputLabel>
          <MuiSelect value={filterActive} label="Active" onChange={(e) => setFilterActive(e.target.value)} sx={{ borderRadius: '12px' }}>
            <MenuItem value="all">All</MenuItem>
            <MenuItem value="true">Active</MenuItem>
            <MenuItem value="false">Inactive</MenuItem>
          </MuiSelect>
        </FormControl> */}

        <FormControl sx={filterSelectSx}>
          <InputLabel>Active</InputLabel>

          <MuiSelect
            value={filterActive}
            label="Active"
            onChange={(e) => {
              setFilterActive(e.target.value);
              setPage(0);
            }}
          >
            <MenuItem value="all">📋 All</MenuItem>
            <MenuItem value="true">🟢 Active</MenuItem>
            <MenuItem value="false">⚪ Inactive</MenuItem>
          </MuiSelect>
        </FormControl>

      </Box>
      <TableContainer
        sx={{
          px: 2,
          pb: 2,
          "& .MuiTableCell-root": {
            borderBottom: "1px solid #f1f5f9",
            py: 2,
            fontSize: "14px"
          },
          "& .MuiTableHead-root .MuiTableCell-root": {
            background: "#fafafa",
            fontWeight: 700,
            color: "#374151"
          },
          "& .MuiTableRow-hover:hover": {
            background: "#fffaf5"
          }
        }}
      >
        <Table sx={{ minWidth: 750 }} aria-labelledby="tableTitle">
          <EnhancedTableHead order={order} orderBy={orderBy} onRequestSort={handleRequestSort} />
          <TableBody>
            {visibleRows.length > 0 ? visibleRows.map((row, index) => {
              const firstImage = getMediaUrl(getPlaceMedia(row).find((media) => getMediaType(media) === 'image'));
              const isDeleted = toBoolean(row.is_deleted);
              return (
                <TableRow hover key={row.id} sx={{ '&:last-child td, &:last-child th': { border: 0 } }}>
                  <TableCell
                    sx={{
                      fontWeight: 700,
                      color: "#111827",
                      fontSize: "15px",
                      width: 70
                    }}
                  >
                    #{row.id}
                  </TableCell>
                  <TableCell>

                    {firstImage ? (
                      <img
                        src={firstImage}
                        alt={row.shop_name || 'Place'}
                        style={{
                          width: 72,
                          height: 72,
                          borderRadius: 14,
                          objectFit: "cover",
                          border: "1px solid #eee",
                          boxShadow: "0 4px 12px rgba(0,0,0,.08)"
                        }}
                      />
                    ) : (
                      <Box className="table-media-empty"><ImageIcon size={24} /></Box>
                    )}
                  </TableCell>
                  <TableCell
                    component="th"
                    scope="row"
                    sx={{
                      fontWeight: 800,
                      color: "#111827",
                      fontSize: "16px",
                      minWidth: 180
                    }}
                  >
                    {row.shop_name}
                  </TableCell>
                  <TableCell
                    sx={{
                      fontWeight: 600,
                      fontSize: "15px"
                    }}
                  >
                    {getRelationName(row.city)}
                  </TableCell>
                  <TableCell
                    sx={{
                      fontWeight: 600,
                      fontSize: "15px"
                    }}
                  >
                    {getRelationName(row.category)}
                  </TableCell>
                  <TableCell align="right"><RatingCircle
                    value={row.safety_rating}
                    type="safety"
                  /></TableCell>
                  <TableCell align="right"><RatingCircle
                    value={row.cost_rating}
                    type="cost"
                  /></TableCell>
                  <TableCell align="center">
                    <Chip
                      label={isDeleted ? 'True' : 'False'}
                      color={isDeleted ? 'error' : 'success'}
                      size="small"
                      sx={{ minWidth: 62, fontWeight: 700 }}
                    />
                  </TableCell>
                  {/* <TableCell width={150}>
                    <Select
                      size="small"
                      fullWidth
                      value={row.status}
                      disabled
                      sx={{
                        borderRadius: "10px",
                        fontWeight: 600,
                        background: "#fff",
                      }}
                    >
                      <MenuItem value="pending">Pending</MenuItem>
                      <MenuItem value="approved">Approved</MenuItem>
                      <MenuItem value="rejected">Rejected</MenuItem>
                    </Select>
                  </TableCell> */}
                  {/* <TableCell width={170}>
                    <FormControl fullWidth size="small">
                      <Select

                        value={row.status.toLowerCase() || ""}
                        disabled
                        displayEmpty
                        sx={{
                          borderRadius: "10px",
                          fontWeight: 600,
                          backgroundColor: "#fff",
                          minWidth: 140,
                        }}
                      >
                        <MenuItem value="pending">Pending</MenuItem>
                        <MenuItem value="approved">Approved</MenuItem>
                        <MenuItem value="rejected">Rejected</MenuItem>
                      </Select>
                    </FormControl>
                  </TableCell> */}
                  <TableCell align="center">
                    <Switch
                      checked={row.is_active}
                      color="success"
                      size="medium"
                      disabled
                    />
                  </TableCell>
                  <TableCell>
                    <Typography
                      sx={{
                        fontWeight: 700,
                        fontSize: 14,
                        color: "#1f2937"
                      }}
                    >
                      {formatDate(row.created_at)}
                    </Typography>
                  </TableCell>
                  <TableCell align="center">
                    <Box
                      sx={{
                        display: "flex",
                        gap: 1,
                        justifyContent: "center",
                      }}
                    >
                      <Tooltip title="View">
                        <IconButton
                          sx={{
                            width: 42,
                            height: 42,
                            borderRadius: "12px",
                            background:
                              "linear-gradient(135deg,#ff9f43,#ff6b35)",
                            color: "#fff",
                            boxShadow: "0 8px 18px rgba(255,140,60,.35)",
                            "&:hover": {
                              background:
                                "linear-gradient(135deg,#ff8b20,#ff5c22)",
                            },
                          }}
                          onClick={() => handleViewDetails(row)}
                        >
                          <Eye size={18} />
                        </IconButton>
                      </Tooltip>

                      <Tooltip title="Edit">
                        <IconButton
                          sx={{
                            width: 42,
                            height: 42,
                            borderRadius: "12px",
                            background:
                              "linear-gradient(135deg,#ff9f43,#ff6b35)",
                            color: "#fff",
                            boxShadow: "0 8px 18px rgba(255,140,60,.35)",
                            "&:hover": {
                              background:
                                "linear-gradient(135deg,#ff8b20,#ff5c22)",
                            },
                          }}
                          onClick={() => handleEdit(row)}
                        >
                          <Edit size={18} />
                        </IconButton>
                      </Tooltip>

                      <Tooltip title={isDeleted ? 'Already deleted' : 'Delete'}>
                        <span>
                          <IconButton
                            disabled={isDeleted}
                            sx={{
                              width: 42,
                              height: 42,
                              borderRadius: "12px",
                              background: "#2f2523",
                              color: "#fff",
                              boxShadow: "0 8px 18px rgba(0,0,0,.18)",
                              "&:hover": {
                                background: "#1e1e1e",
                              },
                              "&.Mui-disabled": {
                                color: "#9ca3af",
                                background: "#e5e7eb",
                                boxShadow: "none",
                              },
                            }}
                            onClick={() => handleDelete(row)}
                          >
                            <Trash2 size={18} />
                          </IconButton>
                        </span>
                      </Tooltip>
                    </Box>
                  </TableCell>
                </TableRow>
              );
            }) : (
              <TableRow>
                <TableCell colSpan={12} align="center" sx={{ p: 4 }}>
                  <Typography variant="subtitle1">No places found.</Typography>
                  <Typography variant="body2" color="text.secondary">Try adjusting your search or filters.</Typography>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>
      <TablePagination
        sx={{
          borderTop: "1px solid #ececec",
          background: "#fcfcfc",

          "& .MuiTablePagination-toolbar": {
            minHeight: 70,
            px: 3,
          },

          "& .MuiTablePagination-selectLabel": {
            fontWeight: 600,
          },

          "& .MuiTablePagination-displayedRows": {
            fontWeight: 600,
          },

          "& .MuiIconButton-root": {
            borderRadius: "10px",

            "&:hover": {
              background: "#fff4ea",
            },
          },
        }}
        rowsPerPageOptions={[5, 10, 25]}
        component="div"
        count={filteredPlaces.length}
        rowsPerPage={rowsPerPage}
        page={page}
        onPageChange={handleChangePage}
        onRowsPerPageChange={handleChangeRowsPerPage}
      />
    </Paper>
  );

  // DETAILS VIEW
  const renderDetailsView = () => {
    if (isDetailsLoading) {
      return (
        <Paper className="details-loading">
          <Skeleton variant="rectangular" height={360} />
          <Skeleton variant="text" width="45%" height={48} />
          <Skeleton variant="rectangular" height={220} />
        </Paper>
      );
    }

    if (!selectedPlace) return null;

    const mediaItems = getPlaceMedia(selectedPlace);
    const heroImageMedia = mediaItems.find((media) => getMediaType(media) === 'image');
    const heroVideoMedia = mediaItems.find((media) => getMediaType(media) === 'video');
    const heroImageUrl = getMediaUrl(heroImageMedia);
    const heroVideoUrl = getMediaUrl(heroVideoMedia);
    const shopName = selectedPlace.shop_name || selectedPlace.name || 'Place';
    const cityName = getRelationName(selectedPlace.city);
    const categoryName = getRelationName(selectedPlace.category);
    const isFeatured = toBoolean(selectedPlace.is_featured ?? selectedPlace.featured);
    const isActive = toBoolean(selectedPlace.is_active ?? selectedPlace.active);

    return (
      <Box className="details-page">
        <Button startIcon={<ArrowLeft size={18} />} onClick={handleBackToList} className="details-back-button">
          Back to List
        </Button>

        <section className="details-hero">
          {heroImageUrl ? (
            <img src={heroImageUrl} alt={shopName} className="details-hero-media" />
          ) : heroVideoUrl ? (
            <video src={heroVideoUrl} className="details-hero-media" controls preload="metadata" />
          ) : (
            <div className="details-hero-empty"><ImageIcon size={52} /><span>No cover media</span></div>
          )}
          <div className="details-hero-overlay">
            <div className="details-hero-content">
              <Typography component="h1" className="details-hero-title">{shopName}</Typography>
              <div className="details-hero-meta">
                <span><MapPin size={17} />{cityName}</span>
                <span><Tag size={17} />{categoryName}</span>
              </div>
              <div className="details-hero-badges">
                {getStatusChip(selectedPlace.status)}
                {getFeaturedChip(isFeatured)}
                {getActiveChip(isActive)}
              </div>
            </div>
          </div>
        </section>

        <section className="details-section">
          <div className="details-section-header">
            <div>
              <Typography component="h2"><ImageIcon size={21} /> Media Gallery</Typography>
              <Typography>{mediaItems.length} {mediaItems.length === 1 ? 'item' : 'items'}</Typography>
            </div>
            {mediaItems.length > 1 && (
              <div className="gallery-navigation">
                <Tooltip title="Previous media">
                  <IconButton onClick={() => scrollMediaGallery(-1)} aria-label="Previous media"><ChevronLeft /></IconButton>
                </Tooltip>
                <Tooltip title="Next media">
                  <IconButton onClick={() => scrollMediaGallery(1)} aria-label="Next media"><ChevronRight /></IconButton>
                </Tooltip>
              </div>
            )}
          </div>

          {mediaItems.length > 0 ? (
            <div className="details-media-gallery" ref={mediaGalleryRef}>
              {mediaItems.map((media, index) => {
                const mediaType = getMediaType(media);
                const mediaUrl = getMediaUrl(media);

                return (
                  <article className="details-media-card" key={media.id || `${mediaType}-${index}`}>
                    {mediaType === 'video' ? (
                      <video src={mediaUrl} controls preload="metadata" />
                    ) : (
                      <button type="button" className="media-preview-button" onClick={() => setLightboxMedia(media)} aria-label={`Preview image ${index + 1}`}>
                        <img src={mediaUrl} alt={`${shopName} media ${index + 1}`} />
                      </button>
                    )}
                    <span className="details-media-type">
                      {mediaType === 'video' ? <VideoIcon size={15} /> : <ImageIcon size={15} />}
                      {mediaType || 'media'}
                    </span>
                  </article>
                );
              })}
            </div>
          ) : (
            <div className="details-empty-state"><ImageIcon size={32} /><span>No media uploaded.</span></div>
          )}
        </section>

        <section className="details-section description-section">
          <div className="details-section-header">
            <div>
              <Typography component="h2">Description</Typography>
              <Typography>About this place</Typography>
            </div>
          </div>
          <Typography className="details-description">{selectedPlace.description || 'No description provided.'}</Typography>
        </section>

        <section className="details-section">
          <div className="details-section-header">
            <div>
              <Typography component="h2">Place Information</Typography>
              <Typography>Location, business and record details</Typography>
            </div>
          </div>

          <div className="detail-information-grid">
            <DetailInfoItem icon={<Map size={20} />} label="City">{cityName}</DetailInfoItem>
            <DetailInfoItem icon={<Tag size={20} />} label="Category">{categoryName}</DetailInfoItem>
            <DetailInfoItem icon={<MapPin size={20} />} label="Address">{selectedPlace.address || '-'}</DetailInfoItem>
            <DetailInfoItem icon={<Link2 size={20} />} label="Google Location">
              {selectedPlace.location ? <a href={selectedPlace.location} target="_blank" rel="noopener noreferrer">Open map</a> : '-'}
            </DetailInfoItem>
            <DetailInfoItem icon={<LocateFixed size={20} />} label="Latitude">{selectedPlace.latitude ?? '-'}</DetailInfoItem>
            <DetailInfoItem icon={<Navigation size={20} />} label="Longitude">{selectedPlace.longitude ?? '-'}</DetailInfoItem>
            <DetailInfoItem icon={<Phone size={20} />} label="Contact Number">{selectedPlace.contact_number || '-'}</DetailInfoItem>
            <DetailInfoItem icon={<Clock size={20} />} label="Opening Time">{formatDisplayTime(selectedPlace.opening_time)}</DetailInfoItem>
            <DetailInfoItem icon={<Clock size={20} />} label="Closing Time">{formatDisplayTime(selectedPlace.closing_time)}</DetailInfoItem>
            <DetailInfoItem icon={<ShieldCheck size={20} />} label="Safety Rating"><Rating value={Number(selectedPlace.safety_rating) || 0} readOnly size="small" /></DetailInfoItem>
            <DetailInfoItem icon={<IndianRupee size={20} />} label="Cost Rating"><Rating value={Number(selectedPlace.cost_rating) || 0} readOnly size="small" /></DetailInfoItem>
            <DetailInfoItem icon={<Star size={20} />} label="Featured">{getFeaturedChip(isFeatured)}</DetailInfoItem>
            <DetailInfoItem icon={<CheckCircle size={20} />} label="Active">{getActiveChip(isActive)}</DetailInfoItem>
            <DetailInfoItem icon={<BadgeCheck size={20} />} label="Status">{getStatusChip(selectedPlace.status)}</DetailInfoItem>
            <DetailInfoItem icon={<Calendar size={20} />} label="Created Date">{formatDate(selectedPlace.created_at)}</DetailInfoItem>
            <DetailInfoItem icon={<Calendar size={20} />} label="Updated Date">{formatDate(selectedPlace.updated_at)}</DetailInfoItem>
          </div>
        </section>
      </Box>
    );
  };

  // CREATE/EDIT FORM VIEW
  const renderFormView = () => (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <form className="crud-form" onSubmit={handleFormSubmit}>
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: 2,
            mb: 4,
            p: 3,
            borderRadius: "22px",
            background: "#ffffff",
            border: "1px solid #eef2f7",
            boxShadow: "0 10px 35px rgba(0,0,0,.05)",
          }}
        >
          <Box>
            <Typography
              variant="h4"
              sx={{
                fontWeight: 800,
                color: "#111827",
                mb: .5,
              }}
            >
              {view === "create"
                ? "📍 Create New Place"
                : "✏️ Edit Place"}
            </Typography>

            <Typography
              sx={{
                color: "#6b7280",
                fontSize: 15,
              }}
            >
              Add complete details including location, business information,
              timings and media.
            </Typography>
          </Box>

          <Button
            variant="outlined"
            startIcon={<ArrowLeft size={18} />}
            onClick={handleBackToList}
            sx={{
              borderRadius: "14px",
              px: 3,
              height: 48,
              textTransform: "none",
              fontWeight: 700,
              borderColor: "#ff8a3d",
              color: "#ff8a3d",

              "&:hover": {
                background: "#fff7f0",
                borderColor: "#ff8a3d",
              },
            }}
          >
            Back to List
          </Button>
        </Box>

        <Box
          sx={{
            mb: 3,
            p: { xs: 2.5, md: 3 },
            borderRadius: "16px",
            background: "#fff",
            border: "1px solid #e5e7eb",
            boxShadow: "0 8px 24px rgba(16,24,40,.06)",
          }}
        >
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 2,
              mb: 3,
            }}
          >
            <Box
              sx={{
                width: 54,
                height: 54,
                borderRadius: "12px",
                background: "linear-gradient(135deg,#ff9f43,#ff6b35)",
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                color: "#fff",
                fontSize: 26,
                boxShadow: "0 8px 20px rgba(255,120,40,.25)",
              }}
            >
              📝
            </Box>

            <Box>
              <Typography
                variant="h6"
                sx={{
                  fontWeight: 800,
                  color: "#111827",
                }}
              >
                Basic Information
              </Typography>

              <Typography
                sx={{
                  color: "#6b7280",
                  fontSize: 14,
                }}
              >
                Enter the primary details about this place.
              </Typography>
            </Box>
          </Box>

          <Divider sx={{ mb: 3 }} />

          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: { xs: "1fr", md: "repeat(6, minmax(0, 1fr))" },
              columnGap: 3,
              rowGap: 3,
            }}
          >

            {/* Row 1 */}

            <Box sx={{ gridColumn: { xs: "auto", md: "span 2" } }}>
              <Typography sx={labelStyle}>
                Place Name <span style={{ color: "#ef4444" }}>*</span>
              </Typography>
              <TextField
                fullWidth
                placeholder="Select Place"
                name="name"
                value={formData.name}
                onChange={handleFormChange}
                required
                error={!!validationErrors.name}
                helperText={validationErrors.name}
                sx={textFieldStyle}
              />
            </Box>

            <Box sx={{ gridColumn: { xs: "auto", md: "span 2" } }}>
              <FormControl fullWidth error={!!validationErrors.city_id}>
                <Typography sx={labelStyle}>
                  Select City <span style={{ color: "#ef4444" }}>*</span>
                </Typography>

                <Select
                  styles={customSelectStyles}
                  options={cityOptions.map(c => ({
                    value: c.id,
                    label: c.name,
                  }))}
                  value={
                    cityOptions
                      .map(c => ({ value: c.id, label: c.name }))
                      .find(o => String(o.value) === String(formData.city_id)) || null
                  }
                  onChange={(opt) => handleSelectChange('city_id', opt)}
                  placeholder="Select City"
                />

                <FormHelperText>
                  {validationErrors.city_id}
                </FormHelperText>
              </FormControl>
            </Box>

            <Box sx={{ gridColumn: { xs: "auto", md: "span 2" } }}>
              <FormControl fullWidth error={!!validationErrors.category_id}>
                <Typography sx={labelStyle}>
                  Select Category <span style={{ color: "#ef4444" }}>*</span>
                </Typography>

                <Select
                  styles={customSelectStyles}
                  options={categoryOptions.map(c => ({
                    value: c.id,
                    label: c.name,
                  }))}
                  value={
                    categoryOptions
                      .map(c => ({ value: c.id, label: c.name }))
                      .find(o => String(o.value) === String(formData.category_id)) || null
                  }
                  onChange={(opt) => handleSelectChange('category_id', opt)}
                  placeholder="Select Category"
                />

                <FormHelperText>
                  {validationErrors.category_id}
                </FormHelperText>
              </FormControl>
            </Box>

            {/* Row 2 */}

            <Box sx={{ gridColumn: { xs: "auto", md: "span 3" } }}>
              <Typography sx={labelStyle}>Description</Typography>
              <TextField
                fullWidth
                multiline
                rows={1}
                placeholder="Enter description about the place..."
                name="description"
                value={formData.description}
                onChange={handleFormChange}
                error={!!validationErrors.description}
                helperText={validationErrors.description}
                sx={textFieldStyle}
              />
            </Box>

            <Box sx={{ gridColumn: { xs: "auto", md: "span 3" } }}>
              <Typography sx={labelStyle}>
                Address <span style={{ color: "#ef4444" }}>*</span>
              </Typography>
              <TextField
                fullWidth
                multiline
                rows={1}
                placeholder="Enter full address..."
                name="address"
                value={formData.address}
                onChange={handleFormChange}
                required
                error={!!validationErrors.address}
                helperText={validationErrors.address}
                sx={textFieldStyle}
              />
            </Box>

          </Box>
        </Box>

        <Box
          sx={{
            mb: 3,
            p: { xs: 2.5, md: 3 },
            borderRadius: "16px",
            background: "#fff",
            border: "1px solid #e5e7eb",
            boxShadow: "0 8px 24px rgba(16,24,40,.06)",
          }}
        >
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 2,
              mb: 3,
            }}
          >
            <Box
              sx={{
                width: 54,
                height: 54,
                borderRadius: "12px",
                background: "linear-gradient(135deg,#3b82f6,#2563eb)",
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                color: "#fff",
                boxShadow: "0 10px 25px rgba(37,99,235,.25)",
              }}
            >
              <MapPinned size={28} />
            </Box>

            <Box>
              <Typography
                variant="h6"
                sx={{
                  fontWeight: 800,
                  color: "#111827",
                }}
              >
                Location Details
              </Typography>

              <Typography
                sx={{
                  color: "#6b7280",
                  fontSize: 14,
                }}
              >
                Help visitors easily find this place using maps.
              </Typography>
            </Box>
          </Box>

          <Divider sx={{ mb: 3 }} />
          <Grid container spacing={3}>
            <Grid size={12}><TextField

              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <MapPinned
                      size={18}
                      color="#ff8a3d"
                    />
                  </InputAdornment>
                ),
              }}

              sx={{
                "& .MuiOutlinedInput-root": {
                  borderRadius: "14px",
                  background: "#fafafa",

                  "& fieldset": {
                    borderColor: "#e5e7eb",
                  },

                  "&:hover fieldset": {
                    borderColor: "#3b82f6",
                  },

                  "&.Mui-focused fieldset": {
                    borderColor: "#3b82f6",
                    borderWidth: 2,
                  },
                },
              }}
              fullWidth label="Google Maps URL / Location" name="location" value={formData.location} onChange={handleFormChange} required error={!!validationErrors.location} helperText={validationErrors.location} /></Grid>
          </Grid>
          <Grid container spacing={3} sx={{ mt: 1 }}>
            <Grid size={{ xs: 12, md: 4 }}><TextField
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    📍
                  </InputAdornment>
                )
              }}

              sx={{
                "& .MuiOutlinedInput-root": {
                  borderRadius: "14px",
                  background: "#fafafa",

                  "& fieldset": {
                    borderColor: "#e5e7eb",
                  },

                  "&:hover fieldset": {
                    borderColor: "#3b82f6",
                  },

                  "&.Mui-focused fieldset": {
                    borderColor: "#3b82f6",
                    borderWidth: 2,
                  },
                },
              }}
              fullWidth type="text" inputMode="decimal" label="Latitude" name="latitude" value={formData.latitude} onChange={handleFormChange} error={!!validationErrors.latitude} helperText={validationErrors.latitude} /></Grid>


            <Grid size={{ xs: 12, md: 4 }}>
              <TextField
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      🧭
                    </InputAdornment>
                  )
                }}

                sx={{
                  "& .MuiOutlinedInput-root": {
                    borderRadius: "14px",
                    background: "#fafafa",

                    "& fieldset": {
                      borderColor: "#e5e7eb",
                    },

                    "&:hover fieldset": {
                      borderColor: "#3b82f6",
                    },

                    "&.Mui-focused fieldset": {
                      borderColor: "#3b82f6",
                      borderWidth: 2,
                    },
                  },
                }}
                fullWidth type="text" inputMode="decimal" label="Longitude" name="longitude" value={formData.longitude} onChange={handleFormChange} error={!!validationErrors.longitude} helperText={validationErrors.longitude} /></Grid>


            <Grid size={{ xs: 12, md: 4 }}>
              <TextField
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Phone
                        size={18}
                        color="#16a34a"
                      />
                    </InputAdornment>
                  )
                }}

                sx={{
                  "& .MuiOutlinedInput-root": {
                    borderRadius: "14px",
                    background: "#fafafa",

                    "& fieldset": {
                      borderColor: "#e5e7eb",
                    },

                    "&:hover fieldset": {
                      borderColor: "#3b82f6",
                    },

                    "&.Mui-focused fieldset": {
                      borderColor: "#3b82f6",
                      borderWidth: 2,
                    },
                  },
                }}
                fullWidth label="Contact Number" name="contact_number" value={formData.contact_number} onChange={handleFormChange} required error={!!validationErrors.contact_number} helperText={validationErrors.contact_number} /></Grid>
          </Grid>
        </Box>

        <Box className="place-section">
          <div className="section-head"><div className="section-icon">🕒</div><div><div className="section-title">Business Details</div><div className="section-desc">Configure timings, ratings and visibility.</div></div></div>
          <Divider sx={{ mb: 3 }} />
          <Grid container spacing={2}>
            <Grid size={{ xs: 12, sm: 6 }}><TimePicker label="Opening Time" value={formData.opening_time} onChange={val => handleTimeChange('opening_time', val)} slotProps={{ textField: { fullWidth: true, required: true, error: !!validationErrors.opening_time, helperText: validationErrors.opening_time } }} /></Grid>
            <Grid size={{ xs: 12, sm: 6 }}><TimePicker label="Closing Time" value={formData.closing_time} onChange={val => handleTimeChange('closing_time', val)} slotProps={{ textField: { fullWidth: true, required: true, error: !!validationErrors.closing_time, helperText: validationErrors.closing_time } }} /></Grid>
            <Grid size={{ xs: 12, sm: 6 }}><FormControl fullWidth error={!!validationErrors.safety_rating}><InputLabel>Safety Rating</InputLabel><MuiSelect name="safety_rating" value={formData.safety_rating} label="Safety Rating" onChange={handleFormChange}>{[1, 2, 3, 4, 5].map(n => <MenuItem key={n} value={n}>{n}</MenuItem>)}</MuiSelect>{validationErrors.safety_rating && <FormHelperText>{validationErrors.safety_rating}</FormHelperText>}</FormControl></Grid>
            <Grid size={{ xs: 12, sm: 6 }}><FormControl fullWidth error={!!validationErrors.cost_rating}><InputLabel>Cost Rating</InputLabel><MuiSelect name="cost_rating" value={formData.cost_rating} label="Cost Rating" onChange={handleFormChange}>{[1, 2, 3, 4, 5].map(n => <MenuItem key={n} value={n}>{n}</MenuItem>)}</MuiSelect>{validationErrors.cost_rating && <FormHelperText>{validationErrors.cost_rating}</FormHelperText>}</FormControl></Grid>
            <Grid size={12} sx={{ display: "flex", justifyContent: "space-around", flexWrap: "wrap", gap: 2 }}>
              <FormControlLabel control={<Switch checked={formData.featured} onChange={handleFormChange} name="featured" />} label="Featured" />
              <FormControlLabel control={<Switch checked={formData.active} onChange={handleFormChange} name="active" />} label="Active" />
              <FormControl error={!!validationErrors.status} sx={{ minWidth: 150 }}><InputLabel>Status</InputLabel><MuiSelect name="status" value={formData.status} label="Status" onChange={handleFormChange}><MenuItem value="Pending">Pending</MenuItem><MenuItem value="Approved">Approved</MenuItem><MenuItem value="Rejected">Rejected</MenuItem></MuiSelect>{validationErrors.status && <FormHelperText>{validationErrors.status}</FormHelperText>}</FormControl>
            </Grid>
          </Grid>
        </Box>

        <Box className="place-section">
          <div className="section-head"><div className="section-icon">📷</div><div><div className="section-title">Photos & Videos</div><div className="section-desc">Upload high quality images and videos.</div></div></div>
          <Divider sx={{ mb: 3 }} />
          <FormControl fullWidth error={!!validationErrors.media_files}>
            <div {...getRootProps({ className: "modern-upload" })}><input {...getInputProps()} /><UploadCloud size={56} strokeWidth={1.6} /><h3>Drag & Drop Files</h3><p>or Click to Browse</p></div>
            {validationErrors.media_files && <FormHelperText>{validationErrors.media_files}</FormHelperText>}
          </FormControl>
          {(existingMediaPreviews.length > 0 || newMediaPreviews.length > 0) && (
            <div className="preview-grid">
              {existingMediaPreviews}
              {newMediaPreviews}
            </div>
          )}
        </Box>

        <div className="submit-area">
          <Button type="submit" variant="contained" size="large" disabled={isFormLoading} sx={{ borderRadius: '12px', padding: '12px 32px' }}>
            {isFormLoading ? 'Saving...' : (view === 'create' ? 'Create Place' : 'Update Place')}
          </Button>
        </div>
      </form>
    </LocalizationProvider>
  );

  return (
    <section className="page-container">
      {apiError && <div className="error-message">{apiError}</div>}
      {successMsg && <div className="success-message">{successMsg}</div>}
      {view === 'table' && renderTableView()}
      {view === 'details' && renderDetailsView()}
      {(view === 'create' || view === 'edit') && renderFormView()}

      <Dialog open={Boolean(deleteTarget)} onClose={closeDeleteDialog} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontWeight: 800 }}>Delete Place?</DialogTitle>
        <DialogContent>
          <DialogContentText>
            This action will soft delete this place. You can restore it later if required.
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5 }}>
          <Button onClick={closeDeleteDialog} disabled={isDeleting} color="inherit">Cancel</Button>
          <Button onClick={confirmDelete} disabled={isDeleting} color="error" variant="contained" startIcon={<Trash2 size={17} />}>
            {isDeleting ? 'Deleting...' : 'Delete'}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={Boolean(lightboxMedia)}
        onClose={() => setLightboxMedia(null)}
        maxWidth="lg"
        fullWidth
        className="media-lightbox"
      >
        <DialogContent className="media-lightbox-content">
          <IconButton className="media-lightbox-close" onClick={() => setLightboxMedia(null)} aria-label="Close image preview">
            <X />
          </IconButton>
          {lightboxMedia && <img src={getMediaUrl(lightboxMedia)} alt="Place media preview" />}
        </DialogContent>
      </Dialog>
    </section>
  );
}

export default Places;
