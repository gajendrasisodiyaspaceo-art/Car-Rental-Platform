const en = {
  // Common
  loading: 'Loading…',
  save: 'Save changes',
  saving: 'Saving…',
  cancel: 'Cancel',

  // Profile screen
  profile: 'Profile',
  personalInfo: 'Personal info',
  name: 'Name',
  email: 'Email',
  phone: 'Phone',
  drivingLicense: 'Driving license',
  licenseNumber: 'License number',
  licenseExpiry: 'Expiry date',
  addresses: 'Addresses',
  addAddress: '+ Add',
  loyaltyPoints: 'Loyalty points',
  loyaltySub: 'Earn points with every booking',
  activePromos: 'Active promo offers',
  language: 'Language',
  logout: 'Log out',
  account: 'Account',
  myBookings: 'My bookings',
  verifyAccount: 'Verify account',
  setDefault: 'Set default',
  remove: 'Remove',
  default: 'Default',
  addressLabel: 'Address',

  // Language switcher
  langEn: 'EN',
  langAr: 'العربية',
} as const;

export default en;
export type TKey = keyof typeof en;
