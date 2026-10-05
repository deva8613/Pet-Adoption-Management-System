// Tamil Nadu Districts List & Coordinates Normalization Utilities

export const TAMILNADU_DISTRICTS = [
  'Ariyalur', 'Chengalpattu', 'Chennai', 'Coimbatore', 'Cuddalore',
  'Dharmapuri', 'Dindigul', 'Erode', 'Kallakurichi', 'Kanchipuram',
  'Kanniyakumari', 'Karur', 'Krishnagiri', 'Madurai', 'Mayiladuthurai',
  'Nagapattinam', 'Namakkal', 'Nilgiris', 'Perambalur', 'Pudukkottai',
  'Ramanathapuram', 'Ranipet', 'Salem', 'Sivaganga', 'Tenkasi',
  'Thanjavur', 'Theni', 'Thoothukudi', 'Tiruchirappalli', 'Tirunelveli',
  'Tirupattur', 'Tiruppur', 'Tiruvallur', 'Tiruvannamalai', 'Tiruvarur',
  'Vellore', 'Viluppuram', 'Virudhunagar'
];

export const DISTRICT_COORDINATES = {
  'chennai': { lat: 13.0827, lng: 80.2707, displayName: 'Chennai' },
  'coimbatore': { lat: 11.0168, lng: 76.9558, displayName: 'Coimbatore' },
  'madurai': { lat: 9.9252, lng: 78.1198, displayName: 'Madurai' },
  'tiruchirappalli': { lat: 10.7905, lng: 78.7047, displayName: 'Tiruchirappalli' },
  'salem': { lat: 11.6643, lng: 78.1460, displayName: 'Salem' },
  'tirunelveli': { lat: 8.7139, lng: 77.7567, displayName: 'Tirunelveli' },
  'erode': { lat: 11.3410, lng: 77.7172, displayName: 'Erode' },
  'vellore': { lat: 12.9165, lng: 79.1325, displayName: 'Vellore' },
  'thanjavur': { lat: 10.7870, lng: 79.1378, displayName: 'Thanjavur' },
  'dindigul': { lat: 10.3673, lng: 77.9803, displayName: 'Dindigul' },
  'kanchipuram': { lat: 12.8342, lng: 79.7036, displayName: 'Kanchipuram' },
  'cuddalore': { lat: 11.7480, lng: 79.7714, displayName: 'Cuddalore' },
  'karur': { lat: 10.9601, lng: 78.0766, displayName: 'Karur' },
  'nagapattinam': { lat: 10.7672, lng: 79.8449, displayName: 'Nagapattinam' },
  'namakkal': { lat: 11.2189, lng: 78.1674, displayName: 'Namakkal' },
  'nilgiris': { lat: 11.4916, lng: 76.7337, displayName: 'Nilgiris' },
  'perambalur': { lat: 11.2342, lng: 78.8821, displayName: 'Perambalur' },
  'pudukkottai': { lat: 10.3833, lng: 78.8000, displayName: 'Pudukkottai' },
  'ramanathapuram': { lat: 9.3639, lng: 78.8395, displayName: 'Ramanathapuram' },
  'ranipet': { lat: 12.9272, lng: 79.3323, displayName: 'Ranipet' },
  'sivaganga': { lat: 9.8433, lng: 78.4809, displayName: 'Sivaganga' },
  'tenkasi': { lat: 8.9593, lng: 77.3148, displayName: 'Tenkasi' },
  'theni': { lat: 10.0104, lng: 77.4768, displayName: 'Theni' },
  'thoothukudi': { lat: 8.7642, lng: 78.1348, displayName: 'Thoothukudi' },
  'tirupattur': { lat: 12.4929, lng: 78.5678, displayName: 'Tirupattur' },
  'tiruppur': { lat: 11.1085, lng: 77.3411, displayName: 'Tiruppur' },
  'tiruvallur': { lat: 13.1432, lng: 79.9079, displayName: 'Tiruvallur' },
  'tiruvannamalai': { lat: 12.2253, lng: 79.0747, displayName: 'Tiruvannamalai' },
  'tiruvarur': { lat: 10.7705, lng: 79.6366, displayName: 'Tiruvarur' },
  'krishnagiri': { lat: 12.5186, lng: 78.2137, displayName: 'Krishnagiri' },
  'kallakurichi': { lat: 11.7384, lng: 78.9639, displayName: 'Kallakurichi' },
  'chengalpattu': { lat: 12.6841, lng: 79.9836, displayName: 'Chengalpattu' },
  'ariyalur': { lat: 11.1401, lng: 79.0782, displayName: 'Ariyalur' },
  'dharmapuri': { lat: 12.1277, lng: 78.1579, displayName: 'Dharmapuri' },
  'kanniyakumari': { lat: 8.0883, lng: 77.5385, displayName: 'Kanniyakumari' },
  'mayiladuthurai': { lat: 11.1018, lng: 79.6521, displayName: 'Mayiladuthurai' },
  'virudhunagar': { lat: 9.5872, lng: 77.9579, displayName: 'Virudhunagar' },
  'viluppuram': { lat: 11.9401, lng: 79.4861, displayName: 'Viluppuram' }
};

export const normalizeLocation = (str) => {
  if (!str || typeof str !== 'string') return '';
  return str.trim().toLowerCase();
};

export const validateDistrict = (districtName) => {
  if (!districtName) return false;
  const normalized = normalizeLocation(districtName);
  return TAMILNADU_DISTRICTS.some(d => d.toLowerCase() === normalized);
};

export const getCanonicalDistrict = (districtName) => {
  if (!districtName) return '';
  const normalized = normalizeLocation(districtName);
  const match = TAMILNADU_DISTRICTS.find(d => d.toLowerCase() === normalized);
  return match || districtName.trim();
};

export const getDistrictCoordinates = (districtName) => {
  if (!districtName) return null;
  const normalized = normalizeLocation(districtName);
  return DISTRICT_COORDINATES[normalized] || null;
};

/**
 * Check whether a user is eligible to adopt a pet based on location rules
 */
export const checkAdoptionEligibility = (user, pet) => {
  if (!user) {
    return { eligible: false, reason: 'Please log in to check adoption eligibility.' };
  }

  if (pet.adoptionStatus !== 'Available') {
    return { eligible: false, reason: 'This pet is no longer available for adoption.' };
  }

  const userDistrict = normalizeLocation(user.district || user.city || '');
  const userCity = normalizeLocation(user.city || user.district || '');
  const userState = normalizeLocation(user.state || 'Tamil Nadu');

  const petDistrict = normalizeLocation(pet.district || pet.location || '');
  const petCity = normalizeLocation(pet.city || pet.location || '');
  const petState = normalizeLocation(pet.state || 'Tamil Nadu');
  const adoptionArea = pet.adoptionArea || 'Anywhere in Tamil Nadu';

  if (!userDistrict && !userCity) {
    return { eligible: false, reason: 'Please complete your location details (District/City) in your Profile to check eligibility.' };
  }

  if (adoptionArea === 'Local Only' || adoptionArea === 'City Only') {
    const cityMatch = userCity && petCity && (userCity.includes(petCity) || petCity.includes(userCity));
    const districtMatch = userDistrict && petDistrict && userDistrict === petDistrict;
    if (!cityMatch && !districtMatch) {
      return {
        eligible: false,
        reason: `Adoption Restricted: This pet is listed for "Local Only" adoption in ${pet.location || pet.district}. Your profile location is ${user.district || user.city}.`
      };
    }
  }

  if (adoptionArea === 'Within District' || adoptionArea === 'District Only') {
    if (!userDistrict || !petDistrict || userDistrict !== petDistrict) {
      return {
        eligible: false,
        reason: `Adoption Restricted: This pet is listed for adoption "Within District" (${pet.district || pet.location}). Your profile location is ${user.district || user.city}.`
      };
    }
  }

  // Statewide rule check
  if (userState !== 'tamil nadu' && userState !== '' && petState === 'tamil nadu') {
    console.log(`[Eligibility Check Failed] userState: "${userState}", petState: "${petState}"`);
    return {
      eligible: false,
      reason: `Adoption Restricted: Adopters must be located within Tamil Nadu.`
    };
  }

  return { eligible: true, reason: 'Eligible for adoption.' };
};
