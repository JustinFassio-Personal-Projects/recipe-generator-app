import {
  LogOut,
  Menu,
  X,
  User,
  Settings,
  ShoppingCart,
  Sparkles,
  BookOpen,
  Compass,
  ChefHat,
  Heart,
  FileText,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthProvider';
import { useTenant } from '@/contexts/TenantContext';
import { useLocation, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { useHasPremiumAccess } from '@/hooks/useSubscription';
import { TermsDialog } from '@/components/legal/TermsDialog';

export function Header() {
  const { user, profile, signOut } = useAuth();
  const { tenant } = useTenant();
  const location = useLocation();
  const navigate = useNavigate();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [termsDialogOpen, setTermsDialogOpen] = useState(false);
  const { hasAccess, isInTrial } = useHasPremiumAccess();

  // Use tenant branding if available
  const logoUrl = tenant?.branding?.logo_url || '/recipe-generator-logo.png';
  const appName = tenant?.name || 'Recipe Generator';

  const handleSignOut = async () => {
    try {
      await signOut();
      navigate('/auth/signin');
    } catch (error) {
      console.error('Sign out error:', error);
    }
  };

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false);
  };

  return (
    <div className="navbar bg-base-300 border-b shadow-sm">
      {/* Section 1: navbar-start (Logo + Mobile Menu) */}
      <div className="navbar-start">
        {/* Mobile Menu Dropdown */}
        <div className="dropdown">
          <button
            tabIndex={0}
            className="btn btn-ghost btn-circle lg:hidden"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            {isMobileMenuOpen ? (
              <X className="h-5 w-5" />
            ) : (
              <Menu className="h-5 w-5" />
            )}
          </button>
          <ul
            tabIndex={0}
            className="menu dropdown-content menu-sm rounded-box bg-base-100 mt-3 w-52 p-2 shadow z-50"
          >
            {/* Mobile Navigation Items */}
            <li>
              <button
                onClick={() => {
                  navigate('/recipes');
                  closeMobileMenu();
                }}
                className={`w-full justify-start ${location.pathname === '/recipes' ? 'active' : ''}`}
              >
                <BookOpen className="h-5 w-5" />
                My Recipes
              </button>
            </li>
            <li>
              <button
                onClick={() => {
                  navigate('/explore');
                  closeMobileMenu();
                }}
                className={`w-full justify-start ${location.pathname === '/explore' ? 'active' : ''}`}
              >
                <Compass className="h-5 w-5" />
                Explore
              </button>
            </li>
            <li>
              <button
                onClick={() => {
                  navigate('/kitchen');
                  closeMobileMenu();
                }}
                className={`w-full justify-start ${location.pathname === '/kitchen' ? 'active' : ''}`}
              >
                <ChefHat className="h-5 w-5" />
                My Kitchen
              </button>
            </li>
            <li>
              <button
                onClick={() => {
                  navigate('/cart');
                  closeMobileMenu();
                }}
                className={`w-full justify-start ${location.pathname === '/cart' ? 'active' : ''}`}
              >
                <ShoppingCart className="h-5 w-5" />
                Shopping List
              </button>
            </li>
            <li>
              <button
                onClick={() => {
                  navigate('/evaluation-report');
                  closeMobileMenu();
                }}
                className={`w-full justify-start ${location.pathname === '/evaluation-report' ? 'active' : ''}`}
              >
                <Heart className="h-5 w-5" />
                Nutrition Reports
              </button>
            </li>
            <li className="divider"></li>
            <li>
              <button
                onClick={() => {
                  navigate('/subscription');
                  closeMobileMenu();
                }}
                className="w-full justify-start"
              >
                <Sparkles className="h-5 w-5" />
                {hasAccess
                  ? isInTrial
                    ? 'Trial Active'
                    : 'Premium Member'
                  : 'Upgrade to Premium'}
              </button>
            </li>
            <li>
              <button
                onClick={() => {
                  navigate('/profile');
                  closeMobileMenu();
                }}
                className="w-full justify-start"
              >
                <Settings className="h-5 w-5" />
                Account Settings
              </button>
            </li>
            <li>
              <button
                onClick={() => {
                  setTermsDialogOpen(true);
                  closeMobileMenu();
                }}
                className="w-full justify-start"
              >
                <FileText className="h-5 w-5" />
                Terms & Conditions
              </button>
            </li>
            <li>
              <button
                onClick={() => {
                  handleSignOut();
                  closeMobileMenu();
                }}
                className="w-full justify-start text-error"
              >
                <LogOut className="h-5 w-5" />
                Sign Out
              </button>
            </li>
          </ul>
        </div>

        {/* Logo and Title */}
        <div className="flex items-center space-x-2">
          <img
            src={logoUrl}
            alt={`${appName} Logo`}
            className="h-10 w-10 lg:h-12 lg:w-12 rounded-lg object-contain"
            onError={(e) => {
              e.currentTarget.src = '/recipe-generator-logo.png';
            }}
          />
          <span className="text-xl font-bold hidden sm:inline">{appName}</span>
        </div>
      </div>

      {/* Section 2: navbar-center (Main Navigation - Desktop Only) */}
      <div className="navbar-center hidden lg:flex">
        <ul className="menu menu-horizontal px-1">
          <li>
            <button
              onClick={() => navigate('/recipes')}
              className={location.pathname === '/recipes' ? 'active' : ''}
            >
              <BookOpen className="h-5 w-5" />
              My Recipes
            </button>
          </li>
          <li>
            <button
              onClick={() => navigate('/explore')}
              className={location.pathname === '/explore' ? 'active' : ''}
            >
              <Compass className="h-5 w-5" />
              Explore
            </button>
          </li>
          <li>
            <button
              onClick={() => navigate('/kitchen')}
              className={location.pathname === '/kitchen' ? 'active' : ''}
            >
              <ChefHat className="h-5 w-5" />
              My Kitchen
            </button>
          </li>
          <li>
            <button
              onClick={() => navigate('/cart')}
              className={location.pathname === '/cart' ? 'active' : ''}
            >
              <ShoppingCart className="h-5 w-5" />
              Shopping List
            </button>
          </li>
          <li>
            <button
              onClick={() => navigate('/evaluation-report')}
              className={
                location.pathname === '/evaluation-report' ? 'active' : ''
              }
            >
              <Heart className="h-5 w-5" />
              Nutrition Reports
            </button>
          </li>
        </ul>
      </div>

      {/* Section 3: navbar-end (Upgrade + Avatar) */}
      <div className="navbar-end">
        {/* Subscription Button */}
        <button
          onClick={() => navigate('/subscription')}
          className={`btn btn-sm ${
            hasAccess ? 'btn-outline btn-primary' : 'btn-primary'
          }`}
        >
          <Sparkles className="h-4 w-4" />
          <span className="hidden xl:inline">
            {hasAccess ? (isInTrial ? 'Trial' : 'Premium') : 'Upgrade'}
          </span>
        </button>

        {/* User Profile Dropdown */}
        <div className="dropdown dropdown-end">
          <div
            tabIndex={0}
            role="button"
            className="btn btn-ghost btn-circle avatar"
          >
            <div className="w-10 rounded-full">
              {profile?.avatar_url ? (
                <img
                  src={profile.avatar_url}
                  alt="Profile"
                  className="rounded-full"
                />
              ) : (
                <div className="bg-primary/20 flex h-full w-full items-center justify-center rounded-full">
                  <User className="text-primary h-5 w-5" />
                </div>
              )}
            </div>
          </div>
          <ul
            tabIndex={0}
            className="menu dropdown-content menu-sm rounded-box bg-base-100 z-[100] mt-3 w-52 border p-2 shadow"
          >
            {user ? (
              <>
                <li className="menu-title">
                  <span className="text-xs">
                    {profile?.username ? (
                      <span className="text-base-content/60">
                        @{profile.username}
                      </span>
                    ) : profile?.full_name ? (
                      profile.full_name
                    ) : (
                      user?.email || 'User'
                    )}
                  </span>
                </li>
                <li>
                  <button
                    onClick={() => navigate('/profile')}
                    className="flex items-center"
                  >
                    <Settings className="mr-2 h-4 w-4" />
                    Account Settings
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => setTermsDialogOpen(true)}
                    className="flex items-center"
                  >
                    <FileText className="mr-2 h-4 w-4" />
                    Terms & Conditions
                  </button>
                </li>
                <li>
                  <button
                    onClick={handleSignOut}
                    className="text-error flex items-center"
                  >
                    <LogOut className="mr-2 h-4 w-4" />
                    Sign Out
                  </button>
                </li>
              </>
            ) : (
              <>
                <li className="menu-title">
                  <span className="text-xs text-base-content/60">Account</span>
                </li>
                <li>
                  <button
                    onClick={() => navigate('/auth/signup')}
                    className="flex items-center"
                  >
                    <User className="mr-2 h-4 w-4" />
                    Sign Up
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => navigate('/auth/signin')}
                    className="flex items-center"
                  >
                    <LogOut className="mr-2 h-4 w-4 rotate-180" />
                    Sign In
                  </button>
                </li>
              </>
            )}
          </ul>
        </div>
      </div>

      {/* Terms & Conditions Dialog */}
      <TermsDialog
        open={termsDialogOpen}
        onOpenChange={setTermsDialogOpen}
        showAcceptButton={false}
      />
    </div>
  );
}
