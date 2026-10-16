export interface SriLankaDistrict {
  id: string;
  name: string;
  province: string;
  estimatedDelivery: string;
}

export const SRI_LANKA_DISTRICTS: SriLankaDistrict[] = [
  // Western Province
  { id: 'colombo', name: 'Colombo', province: 'Western Province', estimatedDelivery: '1 - 2 Business Days' },
  { id: 'gampaha', name: 'Gampaha', province: 'Western Province', estimatedDelivery: '1 - 2 Business Days' },
  { id: 'kalutara', name: 'Kalutara', province: 'Western Province', estimatedDelivery: '2 - 3 Business Days' },

  // Central Province
  { id: 'kandy', name: 'Kandy', province: 'Central Province', estimatedDelivery: '2 - 3 Business Days' },
  { id: 'matale', name: 'Matale', province: 'Central Province', estimatedDelivery: '2 - 4 Business Days' },
  { id: 'nuwara_eliya', name: 'Nuwara Eliya', province: 'Central Province', estimatedDelivery: '2 - 4 Business Days' },

  // Southern Province
  { id: 'galle', name: 'Galle', province: 'Southern Province', estimatedDelivery: '2 - 3 Business Days' },
  { id: 'matara', name: 'Matara', province: 'Southern Province', estimatedDelivery: '2 - 3 Business Days' },
  { id: 'hambantota', name: 'Hambantota', province: 'Southern Province', estimatedDelivery: '2 - 4 Business Days' },

  // North Western Province
  { id: 'kurunegala', name: 'Kurunegala', province: 'North Western Province', estimatedDelivery: '2 - 3 Business Days' },
  { id: 'puttalam', name: 'Puttalam', province: 'North Western Province', estimatedDelivery: '2 - 4 Business Days' },

  // Sabaragamuwa Province
  { id: 'ratnapura', name: 'Ratnapura', province: 'Sabaragamuwa Province', estimatedDelivery: '2 - 4 Business Days' },
  { id: 'kegalle', name: 'Kegalle', province: 'Sabaragamuwa Province', estimatedDelivery: '2 - 3 Business Days' },

  // North Central Province
  { id: 'anuradhapura', name: 'Anuradhapura', province: 'North Central Province', estimatedDelivery: '2 - 4 Business Days' },
  { id: 'polonnaruwa', name: 'Polonnaruwa', province: 'North Central Province', estimatedDelivery: '2 - 4 Business Days' },

  // Uva Province
  { id: 'badulla', name: 'Badulla', province: 'Uva Province', estimatedDelivery: '2 - 4 Business Days' },
  { id: 'monaragala', name: 'Monaragala', province: 'Uva Province', estimatedDelivery: '3 - 4 Business Days' },

  // Eastern Province
  { id: 'trincomalee', name: 'Trincomalee', province: 'Eastern Province', estimatedDelivery: '3 - 4 Business Days' },
  { id: 'batticaloa', name: 'Batticaloa', province: 'Eastern Province', estimatedDelivery: '3 - 4 Business Days' },
  { id: 'ampara', name: 'Ampara', province: 'Eastern Province', estimatedDelivery: '3 - 4 Business Days' },

  // Northern Province
  { id: 'jaffna', name: 'Jaffna', province: 'Northern Province', estimatedDelivery: '3 - 4 Business Days' },
  { id: 'kilinochchi', name: 'Kilinochchi', province: 'Northern Province', estimatedDelivery: '3 - 5 Business Days' },
  { id: 'mannar', name: 'Mannar', province: 'Northern Province', estimatedDelivery: '3 - 5 Business Days' },
  { id: 'vavuniya', name: 'Vavuniya', province: 'Northern Province', estimatedDelivery: '3 - 4 Business Days' },
  { id: 'mullaitivu', name: 'Mullaitivu', province: 'Northern Province', estimatedDelivery: '3 - 5 Business Days' },
];
