// src/constants/apiUrls.js

const BASE_URL = 'http://localhost:8000/api';

export const API_URLS = {
    BASE_URL: BASE_URL,
    // AUTH: `${BASE_URL}/auth/`,
    ADMIN: `${BASE_URL}/admin/`,
    LOGIN: `${BASE_URL}/user/login/`,
    LOGOUT: `${BASE_URL}/user/logout/`,
    RESET: `${BASE_URL}/user/reset/`,
    USER_INFO: `${BASE_URL}/user/info/`,
    USER_CREATE: `${BASE_URL}/user/create/`,
    USER_DELETE: `${BASE_URL}/user/delete/`, // Specify a user ID when using this endpoint
    USER_VALIDATE: `${BASE_URL}/user/validate/`, // Specify a user ID when using this endpoint
    USER_PAYMENT_CREATE: `${BASE_URL}/user/payment/create/`,
    USER_PAYMENT_INFO: `${BASE_URL}/user/payment/info/`,

    // FORMS: `${BASE_URL}/form/`,
    SPECIES_LIST: `${BASE_URL}/species/`,
    USER_SPECIES_LIST: `${BASE_URL}/species/user/`,
    USER_SPECIES_CREATE: `${BASE_URL}/species/user/create/`,

    // DATA: `${BASE_URL}/data/`,
    PROJECTS: `${BASE_URL}/projects/`, // List and create
    PROJECT_DETAIL: `${BASE_URL}/projects/`, // Add a project ID when using this endpoint for detail view
    PROJECT_FILES_POST: `${BASE_URL}/projects/post`, // Add a project ID when using this endpoint for detail view
    PROJECT_FILES_GET: `${BASE_URL}/projects/get`, // Add a project ID when using this endpoint for detail view
    PROJECT_IMAGE_POST: `${BASE_URL}/projects/image/save/`, // Add a project ID when using this endpoint for detail view
    PROJECT_IMAGE_GET: `${BASE_URL}/projects/<int:project_id>/image/`, // Add a project ID when using this endpoint for detail view
    PROJECT_IMAGE_DELETE: `${BASE_URL}/projects/image/delete/<int:image_id>/`, // Add a project ID when using this endpoint for detail view

    // REPORTS: `${BASE_URL}/reports/`,  
    REPORTS: `${BASE_URL}/reports/`, // List reports
    REPORT_DETAIL: `${BASE_URL}/reports/`, // Add a report ID when using this endpoint for detail view

    // AGGREGATE_DATA: `${BASE_URL}/form/all/`,
    AGGREGATE_DATA_ALL: `${BASE_URL}/form/all/`,
    AGGREGATE_DATA_OTHER: `${BASE_URL}/form/all/other/`,
    AGGREGATE_DATA_MARK: `${BASE_URL}/form/all/mark/`,
    AGGREGATE_DATA_SOTVATTEN: `${BASE_URL}/form/all/sotvatten/`,
    AGGREGATE_DATA_HAV: `${BASE_URL}/form/all/hav/`,

    // TRANSFER: `${BASE_URL}/transfer/`,
    TRANSFER_PROJECT: `${BASE_URL}/transfer/`, // Add a project ID when using this endpoint

    // DOWNLOAD: `${BASE_URL}/download/`,
    GEOJSON_API: `${BASE_URL}/file/geojson/`,
    DOWNLOAD_SHAPEFILE: `${BASE_URL}/download/shapefile/`, // Add a data ID when using this endpoint
    DOWNLOAD_GEOPACKFILE: `${BASE_URL}/download/geopackfile/`, // Add a data ID when using this endpoint
    DOWNLOAD_GMLFILE: `${BASE_URL}/download/gmlfile/`, // Add a data ID when using this endpoint
    DOWNLOAD_GEOJSONFILE: `${BASE_URL}/download/geojsonfile/`, // Add a data ID when using this endpoint
};
