/**
 * pages.config.js - Page routing configuration
 * 
 * This file is AUTO-GENERATED. Do not add imports or modify PAGES manually.
 * Pages are auto-registered when you create files in the ./pages/ folder.
 * 
 * THE ONLY EDITABLE VALUE: mainPage
 * This controls which page is the landing page (shown when users visit the app).
 * 
 * Example file structure:
 * 
 *   import HomePage from './pages/HomePage';
 *   import Dashboard from './pages/Dashboard';
 *   import Settings from './pages/Settings';
 *   
 *   export const PAGES = {
 *       "HomePage": HomePage,
 *       "Dashboard": Dashboard,
 *       "Settings": Settings,
 *   }
 *   
 *   export const pagesConfig = {
 *       mainPage: "HomePage",
 *       Pages: PAGES,
 *   };
 * 
 * Example with Layout (wraps all pages):
 *
 *   import Home from './pages/Home';
 *   import Settings from './pages/Settings';
 *   import __Layout from './Layout.jsx';
 *
 *   export const PAGES = {
 *       "Home": Home,
 *       "Settings": Settings,
 *   }
 *
 *   export const pagesConfig = {
 *       mainPage: "Home",
 *       Pages: PAGES,
 *       Layout: __Layout,
 *   };
 *
 * To change the main page from HomePage to Dashboard, use find_replace:
 *   Old: mainPage: "HomePage",
 *   New: mainPage: "Dashboard",
 *
 * The mainPage value must match a key in the PAGES object exactly.
 */
import AgentAvailability from './pages/AgentAvailability';
import Appointments from './pages/Appointments';
import Availability from './pages/Availability';
import Compare from './pages/Compare';
import Favorites from './pages/Favorites';
import Home from './pages/Home';
import Leads from './pages/Leads';
import ListingAnalytics from './pages/ListingAnalytics';
import ListingDetail from './pages/ListingDetail';
import Listings from './pages/Listings';
import Messages from './pages/Messages';
import MyListings from './pages/MyListings';
import OwnerDashboard from './pages/OwnerDashboard';
import PostListing from './pages/PostListing';
import Profile from './pages/Profile';
import SavedSearches from './pages/SavedSearches';
import AdminVerification from './pages/AdminVerification';
import TenantManagement from './pages/TenantManagement';
import __Layout from './Layout.jsx';


export const PAGES = {
    "AgentAvailability": AgentAvailability,
    "Appointments": Appointments,
    "Availability": Availability,
    "Compare": Compare,
    "Favorites": Favorites,
    "Home": Home,
    "Leads": Leads,
    "ListingAnalytics": ListingAnalytics,
    "ListingDetail": ListingDetail,
    "Listings": Listings,
    "Messages": Messages,
    "MyListings": MyListings,
    "OwnerDashboard": OwnerDashboard,
    "PostListing": PostListing,
    "Profile": Profile,
    "SavedSearches": SavedSearches,
    "AdminVerification": AdminVerification,
    "TenantManagement": TenantManagement,
}

export const pagesConfig = {
    mainPage: "Home",
    Pages: PAGES,
    Layout: __Layout,
};