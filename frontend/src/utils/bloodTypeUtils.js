export const getBloodTypeBadge = (bloodType) => {
  const bloodTypeClasses = {
    'A+': 'blood-type-A_pos',
    'A-': 'blood-type-A_neg',
    'B+': 'blood-type-B_pos',
    'B-': 'blood-type-B_neg',
    'AB+': 'blood-type-AB_pos',
    'AB-': 'blood-type-AB_neg',
    'O+': 'blood-type-O_pos',
    'O-': 'blood-type-O_neg',
  };
  return <span className={`blood-type-badge ${bloodTypeClasses[bloodType] || ''}`}>{bloodType}</span>;
};
