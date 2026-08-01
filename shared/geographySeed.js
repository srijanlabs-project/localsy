export const DEFAULT_STATES = [
  { id: 'mh', name: 'Maharashtra' }
];

export const DEFAULT_CITIES = [
  { id: 'navimumbai', stateId: 'mh', name: 'Navi Mumbai' },
  { id: 'mumbai', stateId: 'mh', name: 'Mumbai' }
];

export const DEFAULT_GEOGRAPHY_LOCALITIES = [
  { id: 'roadpali', cityId: 'navimumbai', name: 'Roadpali' },
  { id: 'kalamboli', cityId: 'navimumbai', name: 'Kalamboli' },
  { id: 'kharghar', cityId: 'navimumbai', name: 'Kharghar' },
  { id: 'kamothe', cityId: 'navimumbai', name: 'Kamothe' },
  { id: 'panvel', cityId: 'navimumbai', name: 'Panvel' },
  { id: 'taloja', cityId: 'navimumbai', name: 'Taloja' },
];

export const DEFAULT_AREAS = [
  { id: 'roadpali-sec17', localityId: 'roadpali', cityId: 'navimumbai', name: 'Sector 17, Roadpali', pincode: '410218' },
  { id: 'roadpali-sec15', localityId: 'roadpali', cityId: 'navimumbai', name: 'Sector 15, Roadpali', pincode: '410218' },
  { id: 'roadpali-sec20', localityId: 'roadpali', cityId: 'navimumbai', name: 'Sector 20, Roadpali', pincode: '410218' },
  { id: 'roadpali-sec9e', localityId: 'roadpali', cityId: 'navimumbai', name: 'Sector 9E, Roadpali', pincode: '410218' },
  { id: 'kalamboli-sec11', localityId: 'kalamboli', cityId: 'navimumbai', name: 'Sector 11, Kalamboli', pincode: '410218' },
  { id: 'kalamboli-sec5', localityId: 'kalamboli', cityId: 'navimumbai', name: 'Sector 5E, Kalamboli', pincode: '410218' },
  { id: 'kalamboli-sec2', localityId: 'kalamboli', cityId: 'navimumbai', name: 'Sector 2E, Kalamboli', pincode: '410218' },
  { id: 'kharghar-sec12', localityId: 'kharghar', cityId: 'navimumbai', name: 'Sector 12, Kharghar', pincode: '410210' },
  { id: 'kamothe-sec10', localityId: 'kamothe', cityId: 'navimumbai', name: 'Sector 10, Kamothe', pincode: '410209' },
  { id: 'panvel-sec15', localityId: 'panvel', cityId: 'navimumbai', name: 'Sector 15A, Panvel', pincode: '410206' },
  { id: 'panvel-new-sec', localityId: 'panvel', cityId: 'navimumbai', name: 'New Sector Cluster, Panvel', pincode: '410221' },
  { id: 'taloja-phase1', localityId: 'taloja', cityId: 'navimumbai', name: 'Phase 1, Taloja', pincode: '410208' },
];
