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

export const normalizeLocation = (str) => {
  if (!str || typeof str !== 'string') return '';
  return str.trim().toLowerCase();
};

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
    return { eligible: false, reason: 'Please complete your location details (District/City) in your Profile.' };
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

  if (userState !== 'tamil nadu' && userState !== '' && petState === 'tamil nadu') {
    return {
      eligible: false,
      reason: `Adoption Restricted: Adopters must be located within Tamil Nadu.`
    };
  }

  return { eligible: true, reason: 'Eligible for adoption.' };
};
