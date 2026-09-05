import { supabase } from '@/lib/supabase/client';
import { getLocalUserTripoLeadAccessMap } from '@/services/adminService';

export type TripoLeadStatus = 'Pending' | 'No Response' | 'Complete' | 'Follow up';

export const TRIPO_LEAD_PROFESSIONAL_OPTIONS = [
  'Stay Provider',
  'Packager',
  'Guide',
  'Traveler',
] as const;

export const INDIAN_STATES = [
  'Andaman and Nicobar Islands',
  'Andhra Pradesh',
  'Arunachal Pradesh',
  'Assam',
  'Bihar',
  'Chandigarh',
  'Chhattisgarh',
  'Dadra and Nagar Haveli and Daman and Diu',
  'Delhi',
  'Goa',
  'Gujarat',
  'Haryana',
  'Himachal Pradesh',
  'Jammu and Kashmir',
  'Jharkhand',
  'Karnataka',
  'Kerala',
  'Ladakh',
  'Lakshadweep',
  'Madhya Pradesh',
  'Maharashtra',
  'Manipur',
  'Meghalaya',
  'Mizoram',
  'Nagaland',
  'Odisha',
  'Puducherry',
  'Punjab',
  'Rajasthan',
  'Sikkim',
  'Tamil Nadu',
  'Telangana',
  'Tripura',
  'Uttar Pradesh',
  'Uttarakhand',
  'West Bengal',
] as const;

export const INDIAN_STATES_DISTRICTS_MAP: Record<string, string[]> = {
  'Andaman and Nicobar Islands': [
    'Nicobar',
    'North and Middle Andaman',
    'South Andaman',
  ],
  'Andhra Pradesh': [
    'Alluri Sitharama Raju',
    'Anakapalli',
    'Ananthapuramu',
    'Annamayya',
    'Bapatla',
    'Chittoor',
    'East Godavari',
    'Eluru',
    'Guntur',
    'Kakinada',
    'NTR',
    'Nandyal',
    'Palnadu',
    'Parvathipuram Manyam',
    'Prakasam',
    'Sri Potti Sriramulu Nellore',
    'Sri Sathya Sai',
    'Srikakulam',
    'Tirupati',
    'Visakhapatnam',
    'Vizianagaram',
    'West Godavari',
    'YSR Kadapa',
  ],
  'Arunachal Pradesh': [
    'Anjaw',
    'Changlang',
    'Dibang Valley',
    'East Kameng',
    'East Siang',
    'Itanagar',
    'Kamle',
    'Kra Daadi',
    'Kurung Kumey',
    'Lepa Rada',
    'Lohit',
    'Longding',
    'Lower Dibang Valley',
    'Lower Subansiri',
    'Namsai',
    'Pakke Kessang',
    'Papum Pare',
    'Shi Yomi',
    'Siang',
    'Tawang',
    'Tirap',
    'Upper Siang',
    'Upper Subansiri',
    'West Kameng',
    'West Siang',
  ],
  'Assam': [
    'Baksa',
    'Barpeta',
    'Biswanath',
    'Bongaigaon',
    'Cachar',
    'Charaideo',
    'Chirang',
    'Darrang',
    'Dhemaji',
    'Dhubri',
    'Dibrugarh',
    'Dima Hasao',
    'Goalpara',
    'Golaghat',
    'Hailakandi',
    'Hojai',
    'Jorhat',
    'Kamrup',
    'Kamrup Metropolitan',
    'Karbi Anglong',
    'Karimganj',
    'Kokrajhar',
    'Lakhimpur',
    'Majuli',
    'Morigaon',
    'Nagaon',
    'Nalbari',
    'Sivasagar',
    'Sonitpur',
    'South Salmara-Mankachar',
    'Tinsukia',
    'Udalguri',
    'West Karbi Anglong',
  ],
  'Bihar': [
    'Araria',
    'Arwal',
    'Aurangabad',
    'Banka',
    'Begusarai',
    'Bhagalpur',
    'Bhojpur',
    'Buxar',
    'Darbhanga',
    'East Champaran',
    'Gaya',
    'Gopalganj',
    'Jamui',
    'Jehanabad',
    'Kaimur',
    'Katihar',
    'Khagaria',
    'Kishanganj',
    'Lakhisarai',
    'Madhepura',
    'Madhubani',
    'Munger',
    'Muzaffarpur',
    'Nalanda',
    'Nawada',
    'Patna',
    'Purnia',
    'Rohtas',
    'Saharsa',
    'Samastipur',
    'Saran',
    'Sheikhpura',
    'Sheohar',
    'Sitamarhi',
    'Siwan',
    'Supaul',
    'Vaishali',
    'West Champaran',
  ],
  'Chandigarh': ['Chandigarh'],
  'Chhattisgarh': [
    'Balod',
    'Baloda Bazar',
    'Balrampur',
    'Bastar',
    'Bemetara',
    'Bijapur',
    'Bilaspur',
    'Dantewada',
    'Dhamtari',
    'Durg',
    'Gariaband',
    'Gaurela-Pendra-Marwahi',
    'Janjgir-Champa',
    'Jashpur',
    'Kabirdham',
    'Kanker',
    'Khairagarh-Chhuikhadan-Gandai',
    'Kondagaon',
    'Korba',
    'Koriya',
    'Mahasamund',
    'Manendragarh-Chirmiri-Bharatpur',
    'Mohla-Manpur-Ambagarh Chowki',
    'Mungeli',
    'Narayanpur',
    'Raigarh',
    'Raipur',
    'Rajnandgaon',
    'Sarangarh-Bilaigarh',
    'Shakti',
    'Sukma',
    'Surajpur',
    'Surguja',
  ],
  'Dadra and Nagar Haveli and Daman and Diu': [
    'Dadra and Nagar Haveli',
    'Daman',
    'Diu',
  ],
  'Delhi': [
    'Central Delhi',
    'East Delhi',
    'New Delhi',
    'North Delhi',
    'North East Delhi',
    'North West Delhi',
    'Shahdara',
    'South Delhi',
    'South East Delhi',
    'South West Delhi',
    'West Delhi',
  ],
  'Goa': ['North Goa', 'South Goa'],
  'Gujarat': [
    'Ahmedabad',
    'Amreli',
    'Anand',
    'Aravalli',
    'Banaskantha',
    'Bharuch',
    'Bhavnagar',
    'Botad',
    'Chhota Udaipur',
    'Dahod',
    'Dang',
    'Devbhumi Dwarka',
    'Gandhinagar',
    'Gir Somnath',
    'Jamnagar',
    'Junagadh',
    'Kheda',
    'Kutch',
    'Mahisagar',
    'Mehsana',
    'Morbi',
    'Narmada',
    'Navsari',
    'Panchmahal',
    'Patan',
    'Porbandar',
    'Rajkot',
    'Sabarkantha',
    'Surat',
    'Surendranagar',
    'Tapi',
    'Vadodara',
    'Valsad',
  ],
  'Haryana': [
    'Ambala',
    'Bhiwani',
    'Charkhi Dadri',
    'Faridabad',
    'Fatehabad',
    'Gurugram',
    'Hisar',
    'Jhajjar',
    'Jind',
    'Kaithal',
    'Karnal',
    'Kurukshetra',
    'Mahendragarh',
    'Nuh',
    'Palwal',
    'Panchkula',
    'Panipat',
    'Rewari',
    'Rohtak',
    'Sirsa',
    'Sonipat',
    'Yamunanagar',
  ],
  'Himachal Pradesh': [
    'Bilaspur',
    'Chamba',
    'Hamirpur',
    'Kangra',
    'Kinnaur',
    'Kullu',
    'Lahaul and Spiti',
    'Mandi',
    'Shimla',
    'Sirmaur',
    'Solan',
    'Una',
  ],
  'Jammu and Kashmir': [
    'Anantnag',
    'Bandipora',
    'Baramulla',
    'Budgam',
    'Doda',
    'Ganderbal',
    'Jammu',
    'Kathua',
    'Kishtwar',
    'Kulgam',
    'Kupwara',
    'Poonch',
    'Pulwama',
    'Rajouri',
    'Ramban',
    'Reasi',
    'Samba',
    'Shopian',
    'Srinagar',
    'Udhampur',
  ],
  'Jharkhand': [
    'Bokaro',
    'Chatra',
    'Deoghar',
    'Dhanbad',
    'Dumka',
    'East Singhbhum',
    'Garhwa',
    'Giridih',
    'Godda',
    'Gumla',
    'Hazaribagh',
    'Jamtara',
    'Khunti',
    'Koderma',
    'Latehar',
    'Lohardaga',
    'Pakur',
    'Palamu',
    'Ramgarh',
    'Ranchi',
    'Sahebganj',
    'Seraikela Kharsawan',
    'Simdega',
    'West Singhbhum',
  ],
  'Karnataka': [
    'Bagalkote',
    'Ballari',
    'Belagavi',
    'Bengaluru Rural',
    'Bengaluru Urban',
    'Bidar',
    'Chamarajanagara',
    'Chikkaballapura',
    'Chikkamagaluru',
    'Chitradurga',
    'Dakshina Kannada',
    'Davanagere',
    'Dharwad',
    'Gadag',
    'Hassan',
    'Haveri',
    'Kalaburagi',
    'Kodagu',
    'Kolar',
    'Koppal',
    'Mandya',
    'Mysuru',
    'Raichur',
    'Ramanagara',
    'Shivamogga',
    'Tumakuru',
    'Udupi',
    'Uttara Kannada',
    'Vijayanagara',
    'Vijayapura',
    'Yadgir',
  ],
  'Kerala': [
    'Alappuzha',
    'Ernakulam',
    'Idukki',
    'Kannur',
    'Kasaragod',
    'Kollam',
    'Kottayam',
    'Kozhikode',
    'Malappuram',
    'Palakkad',
    'Pathanamthitta',
    'Thiruvananthapuram',
    'Thrissur',
    'Wayanad',
  ],
  'Ladakh': ['Kargil', 'Leh'],
  'Lakshadweep': ['Lakshadweep'],
  'Madhya Pradesh': [
    'Agar Malwa',
    'Alirajpur',
    'Anuppur',
    'Ashoknagar',
    'Balaghat',
    'Barwani',
    'Betul',
    'Bhind',
    'Bhopal',
    'Burhanpur',
    'Chhatarpur',
    'Chhindwara',
    'Damoh',
    'Datia',
    'Dewas',
    'Dhar',
    'Dindori',
    'Guna',
    'Gwalior',
    'Harda',
    'Indore',
    'Jabalpur',
    'Jhabua',
    'Katni',
    'Khandwa',
    'Khargone',
    'Mandla',
    'Mandsaur',
    'Mauganj',
    'Morena',
    'Narsinghpur',
    'Neemuch',
    'Niwari',
    'Panna',
    'Raisen',
    'Rajgarh',
    'Ratlam',
    'Rewa',
    'Sagar',
    'Satna',
    'Sehore',
    'Seoni',
    'Shahdol',
    'Shajapur',
    'Sheopur',
    'Shivpuri',
    'Sidhi',
    'Singrauli',
    'Tikamgarh',
    'Ujjain',
    'Umaria',
    'Vidisha',
  ],
  'Maharashtra': [
    'Ahmednagar',
    'Akola',
    'Amravati',
    'Beed',
    'Bhandara',
    'Buldhana',
    'Chandrapur',
    'Chhatrapati Sambhaji Nagar',
    'Dharashiv',
    'Dhule',
    'Gadchiroli',
    'Gondia',
    'Hingoli',
    'Jalgaon',
    'Jalna',
    'Kolhapur',
    'Latur',
    'Mumbai City',
    'Mumbai Suburban',
    'Nagpur',
    'Nanded',
    'Nandurbar',
    'Nashik',
    'Palghar',
    'Parbhani',
    'Pune',
    'Raigad',
    'Ratnagiri',
    'Sangli',
    'Satara',
    'Sindhudurg',
    'Solapur',
    'Thane',
    'Wardha',
    'Washim',
    'Yavatmal',
  ],
  'Manipur': [
    'Bishnupur',
    'Chandel',
    'Churachandpur',
    'Imphal East',
    'Imphal West',
    'Jiribam',
    'Kakching',
    'Kamjong',
    'Kangpokpi',
    'Noney',
    'Pherzawl',
    'Senapati',
    'Tamenglong',
    'Tengnoupal',
    'Ukhrul',
  ],
  'Meghalaya': [
    'East Garo Hills',
    'East Jaintia Hills',
    'East Khasi Hills',
    'Eastern West Khasi Hills',
    'North Garo Hills',
    'Ri Bhoi',
    'South Garo Hills',
    'South West Garo Hills',
    'South West Khasi Hills',
    'West Garo Hills',
    'West Jaintia Hills',
    'West Khasi Hills',
  ],
  'Mizoram': [
    'Aizawl',
    'Champhai',
    'Hnahthial',
    'Khawzawl',
    'Kolasib',
    'Lawngtlai',
    'Lunglei',
    'Mamit',
    'Saiha',
    'Saitual',
    'Serchhip',
  ],
  'Nagaland': [
    'Chumoukedima',
    'Dimapur',
    'Kiphire',
    'Kohima',
    'Longleng',
    'Mokokchung',
    'Mon',
    'Niuland',
    'Noklak',
    'Peren',
    'Phek',
    'Shamator',
    'Tseminyu',
    'Tuensang',
    'Wokha',
    'Zunheboto',
  ],
  'Odisha': [
    'Angul',
    'Balangir',
    'Balasore',
    'Bargarh',
    'Bhadrak',
    'Boudh',
    'Cuttack',
    'Deogarh',
    'Dhenkanal',
    'Gajapati',
    'Ganjam',
    'Jagatsinghpur',
    'Jajpur',
    'Jharsuguda',
    'Kalahandi',
    'Kandhamal',
    'Kendrapara',
    'Kendujhar',
    'Khordha',
    'Koraput',
    'Malkangiri',
    'Mayurbhanj',
    'Nabarangpur',
    'Nayagarh',
    'Nuapada',
    'Puri',
    'Rayagada',
    'Sambalpur',
    'Subarnapur',
    'Sundargarh',
  ],
  'Puducherry': ['Karaikal', 'Mahe', 'Puducherry', 'Yanam'],
  'Punjab': [
    'Amritsar',
    'Barnala',
    'Bathinda',
    'Faridkot',
    'Fatehgarh Sahib',
    'Fazilka',
    'Firozpur',
    'Gurdaspur',
    'Hoshiarpur',
    'Jalandhar',
    'Kapurthala',
    'Ludhiana',
    'Malerkotla',
    'Mansa',
    'Moga',
    'Pathankot',
    'Patiala',
    'Rupnagar',
    'Sahibzada Ajit Singh Nagar (Mohali)',
    'Shaheed Bhagat Singh Nagar',
    'Sri Muktsar Sahib',
    'Tarn Taran',
  ],
  'Rajasthan': [
    'Ajmer',
    'Alwar',
    'Anupgarh',
    'Banswara',
    'Baran',
    'Barmer',
    'Beawar',
    'Bharatpur',
    'Bhilwara',
    'Bikaner',
    'Bundi',
    'Chittorgarh',
    'Churu',
    'Dausa',
    'Deeg',
    'Dholpur',
    'Didwana-Kuchaman',
    'Dungarpur',
    'Gangapur City',
    'Hanumangarh',
    'Jaipur',
    'Jaipur Rural',
    'Jaisalmer',
    'Jalore',
    'Jhalawar',
    'Jhunjhunu',
    'Jodhpur',
    'Jodhpur Rural',
    'Karauli',
    'Kekri',
    'Khairthal-Tijara',
    'Kota',
    'Kotputli-Behror',
    'Nagaur',
    'Neem Ka Thana',
    'Pali',
    'Phalodi',
    'Pratapgarh',
    'Rajsamand',
    'Salumbar',
    'Sanchore',
    'Sawai Madhopur',
    'Shahpura',
    'Sikar',
    'Sirohi',
    'Sri Ganganagar',
    'Tonk',
    'Udaipur',
  ],
  'Sikkim': ['Gangtok', 'Gyalshing', 'Mangan', 'Namchi', 'Pakyong', 'Soreng'],
  'Tamil Nadu': [
    'Ariyalur',
    'Chengalpattu',
    'Chennai',
    'Coimbatore',
    'Cuddalore',
    'Dharmapuri',
    'Dindigul',
    'Erode',
    'Kallakurichi',
    'Kanchipuram',
    'Kanyakumari',
    'Karur',
    'Krishnagiri',
    'Madurai',
    'Mayiladuthurai',
    'Nagapattinam',
    'Namakkal',
    'Nilgiris',
    'Perambalur',
    'Pudukkottai',
    'Ramanathapuram',
    'Ranipet',
    'Salem',
    'Sivagangai',
    'Tenkasi',
    'Thanjavur',
    'Theni',
    'Thoothukudi (Tuticorin)',
    'Tiruchirappalli (Trichy)',
    'Tirunelveli',
    'Tirupathur',
    'Tiruppur',
    'Tiruvallur',
    'Tiruvannamalai',
    'Tiruvarur',
    'Vellore',
    'Viluppuram',
    'Virudhunagar',
  ],
  'Telangana': [
    'Adilabad',
    'Bhadradri Kothagudem',
    'Hanamkonda',
    'Hyderabad',
    'Jagtial',
    'Jangaon',
    'Jayashankar Bhupalpally',
    'Jogulamba Gadwal',
    'Kamareddy',
    'Karimnagar',
    'Khammam',
    'Kumuram Bheem Asifabad',
    'Mahabubabad',
    'Mahabubnagar',
    'Mancherial',
    'Medak',
    'Medchal-Malkajgiri',
    'Mulugu',
    'Nagarkurnool',
    'Nalgonda',
    'Narayanpet',
    'Nirmal',
    'Nizamabad',
    'Peddapalli',
    'Rajanna Sircilla',
    'Ranga Reddy',
    'Sangareddy',
    'Siddipet',
    'Suryapet',
    'Vikarabad',
    'Wanaparthy',
    'Warangal',
    'Yadadri Bhuvanagiri',
  ],
  'Tripura': [
    'Dhalai',
    'Gomati',
    'Khowai',
    'North Tripura',
    'Sepahijala',
    'South Tripura',
    'Unakoti',
    'West Tripura',
  ],
  'Uttar Pradesh': [
    'Agra',
    'Aligarh',
    'Ambedkar Nagar',
    'Amethi',
    'Amroha',
    'Auraiya',
    'Ayodhya',
    'Azamgarh',
    'Baghpat',
    'Bahraich',
    'Ballia',
    'Balrampur',
    'Banda',
    'Barabanki',
    'Bareilly',
    'Basti',
    'Bhadohi',
    'Bijnor',
    'Budaun',
    'Bulandshahr',
    'Chandauli',
    'Chitrakoot',
    'Deoria',
    'Etah',
    'Etawah',
    'Farrukhabad',
    'Fatehpur',
    'Firozabad',
    'Gautam Buddha Nagar',
    'Ghaziabad',
    'Ghazipur',
    'Gonda',
    'Gorakhpur',
    'Hamirpur',
    'Hapur',
    'Hardoi',
    'Hathras',
    'Jalaun',
    'Jaunpur',
    'Jhansi',
    'Kannauj',
    'Kanpur Dehat',
    'Kanpur Nagar',
    'Kasganj',
    'Kaushambi',
    'Kheri',
    'Kushinagar',
    'Lalitpur',
    'Lucknow',
    'Maharajganj',
    'Mahoba',
    'Mainpuri',
    'Mathura',
    'Mau',
    'Meerut',
    'Mirzapur',
    'Moradabad',
    'Muzaffarnagar',
    'Pilibhit',
    'Pratapgarh',
    'Prayagraj',
    'Raebareli',
    'Rampur',
    'Saharanpur',
    'Sambhal',
    'Sant Kabir Nagar',
    'Shahjahanpur',
    'Shamli',
    'Shravasti',
    'Siddharthnagar',
    'Sitapur',
    'Sonbhadra',
    'Sultanpur',
    'Unnao',
    'Varanasi',
  ],
  'Uttarakhand': [
    'Almora',
    'Bageshwar',
    'Chamoli',
    'Champawat',
    'Dehradun',
    'Haridwar',
    'Nainital',
    'Pauri Garhwal',
    'Pithoragarh',
    'Rudraprayag',
    'Tehri Garhwal',
    'Udham Singh Nagar',
    'Uttarkashi',
  ],
  'West Bengal': [
    'Alipurduar',
    'Bankura',
    'Birbhum',
    'Cooch Behar',
    'Dakshin Dinajpur',
    'Darjeeling',
    'Hooghly',
    'Howrah',
    'Jalpaiguri',
    'Jhargram',
    'Kalimpong',
    'Kolkata',
    'Malda',
    'Murshidabad',
    'Nadia',
    'North 24 Parganas',
    'Paschim Bardhaman',
    'Paschim Medinipur',
    'Purba Bardhaman',
    'Purba Medinipur',
    'Purulia',
    'South 24 Parganas',
    'Uttar Dinajpur',
  ],
};

export const TAMIL_NADU_DISTRICTS = INDIAN_STATES_DISTRICTS_MAP['Tamil Nadu'];

export interface TripoLeadEntry {
  id: string;
  task_id: string;
  hotel_name: string;
  district: string;
  area: string;
  location_link?: string | null;
  professional?: string | null;
  mobile_number?: string | null;
  state?: string | null;
  status?: TripoLeadStatus | null;
  approach_date?: string | null;
  short_notes?: string | null;
  deleted_at?: string | null;
  created_at: string;
  updated_at: string;
}

export interface TripoLeadFolder {
  id: string;
  task_id: string;
  name: string;
  created_at: string;
  updated_at: string;
  deleted_at?: string | null;
}


const LOCAL_STORAGE_PREFIX = 'dm_tripolead_entries_';
const FOLDERS_LOCAL_STORAGE_PREFIX = 'dm_tripolead_folders_';

function getLocalEntries(taskId: string): TripoLeadEntry[] {
  try {
    const data = localStorage.getItem(`${LOCAL_STORAGE_PREFIX}${taskId}`);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

function saveLocalEntries(taskId: string, entries: TripoLeadEntry[]) {
  try {
    localStorage.setItem(`${LOCAL_STORAGE_PREFIX}${taskId}`, JSON.stringify(entries));
  } catch {}
}

function getLocalFolders(taskId: string): TripoLeadFolder[] {
  try {
    const data = localStorage.getItem(`${FOLDERS_LOCAL_STORAGE_PREFIX}${taskId}`);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

function saveLocalFolders(taskId: string, folders: TripoLeadFolder[]) {
  try {
    localStorage.setItem(`${FOLDERS_LOCAL_STORAGE_PREFIX}${taskId}`, JSON.stringify(folders));
  } catch {}
}

export async function getTripoLeadFolders(taskId: string, search?: string): Promise<TripoLeadFolder[]> {
  try {
    const { data, error } = await supabase
      .from('folders')
      .select('*')
      .eq('parent_id', taskId)
      .is('deleted_at', null)
      .order('created_at', { ascending: false });

    if (!error && data) {
      const dbFolders: TripoLeadFolder[] = data.map((d: any) => ({
        id: d.id,
        task_id: taskId,
        name: d.name,
        created_at: d.created_at,
        updated_at: d.updated_at,
        deleted_at: d.deleted_at,
      }));

      const dbIds = new Set(dbFolders.map((f) => f.id));
      const localOnly = getLocalFolders(taskId).filter((f) => !dbIds.has(f.id) && !f.deleted_at);
      const merged = [...localOnly, ...dbFolders];

      if (!search || !search.trim()) return merged;
      const s = search.trim().toLowerCase();
      return merged.filter((f) => f.name.toLowerCase().includes(s));
    }
  } catch {}

  const local = getLocalFolders(taskId).filter((f) => !f.deleted_at);
  if (!search || !search.trim()) return local;
  const s = search.trim().toLowerCase();
  return local.filter((f) => f.name.toLowerCase().includes(s));
}

export async function createTripoLeadFolder(taskId: string, name: string, userId?: string): Promise<TripoLeadFolder> {
  const newFolder: TripoLeadFolder = {
    id: crypto.randomUUID(),
    task_id: taskId,
    name: name.trim(),
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    deleted_at: null,
  };

  const local = getLocalFolders(taskId);
  local.unshift(newFolder);
  saveLocalFolders(taskId, local);

  try {
    const { data, error } = await supabase
      .from('folders')
      .insert({
        id: newFolder.id,
        owner_id: userId || null,
        parent_id: taskId,
        name: newFolder.name,
      })
      .select()
      .single();

    if (!error && data) {
      const updatedLocal = getLocalFolders(taskId).map((f) => (f.id === newFolder.id ? { ...newFolder, id: data.id } : f));
      saveLocalFolders(taskId, updatedLocal);
      return {
        id: data.id,
        task_id: taskId,
        name: data.name,
        created_at: data.created_at,
        updated_at: data.updated_at,
      };
    }
  } catch {}

  return newFolder;
}

export async function deleteTripoLeadFolder(taskId: string, folderId: string): Promise<void> {
  const local = getLocalFolders(taskId).filter((f) => f.id !== folderId);
  saveLocalFolders(taskId, local);

  try {
    await supabase.from('folders').delete().eq('id', folderId);
  } catch {}
}

/**
 * Check if current user is Admin
 */
async function checkIsAdmin(userId?: string): Promise<boolean> {
  if (!userId) return false;

  // 1. Check local access override first
  const accessMap = getLocalUserTripoLeadAccessMap();
  if (accessMap[userId] === 'locked') {
    return false;
  }

  // 2. Check Supabase admin_users table
  try {
    const { data } = await supabase
      .from('admin_users')
      .select('role')
      .eq('user_id', userId)
      .maybeSingle();

    if (data) return true;
  } catch {}

  // 3. Check RPC is_admin
  try {
    const { data: isAdminRpc } = await supabase.rpc('is_admin', { uid: userId });
    if (isAdminRpc === true) return true;
  } catch {}

  return false;
}

export async function getTripoLeadEntries(
  taskId: string,
  search?: string
): Promise<TripoLeadEntry[]> {
  try {
    let query = supabase
      .from('tripolead_entries')
      .select('*')
      .eq('task_id', taskId)
      .is('deleted_at', null)
      .order('created_at', { ascending: false });

    if (search && search.trim()) {
      const s = `%${search.trim()}%`;
      query = query.or(`hotel_name.ilike.${s},district.ilike.${s},area.ilike.${s},professional.ilike.${s},mobile_number.ilike.${s}`);
    }

    const { data, error } = await query;
    if (!error && data) {
      const localMap = new Map(getLocalEntries(taskId).map((e) => [e.id, e]));
      const merged = (data as TripoLeadEntry[]).map((dbEntry) => {
        const local = localMap.get(dbEntry.id);
        if (local && local.updated_at > dbEntry.updated_at) {
          return local;
        }
        return dbEntry;
      });

      // Add local-only entries that don't exist in DB yet
      const dbIds = new Set(data.map((d: any) => d.id));
      getLocalEntries(taskId).forEach((loc) => {
        if (!dbIds.has(loc.id) && !loc.deleted_at) {
          merged.unshift(loc);
        }
      });

      return merged;
    }
  } catch {}

  const local = getLocalEntries(taskId).filter((e) => !e.deleted_at);
  if (!search || !search.trim()) return local;
  const s = search.trim().toLowerCase();
  return local.filter(
    (e) =>
      e.hotel_name.toLowerCase().includes(s) ||
      e.district.toLowerCase().includes(s) ||
      e.area.toLowerCase().includes(s) ||
      (e.professional && e.professional.toLowerCase().includes(s)) ||
      (e.mobile_number && e.mobile_number.toLowerCase().includes(s))
  );
}

export async function getTripoLeadRecentEntries(
  taskId: string,
  limit: number = 20
): Promise<TripoLeadEntry[]> {
  const all = await getTripoLeadEntries(taskId);
  return all
    .sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime())
    .slice(0, limit);
}

export async function getTripoLeadTrashEntries(
  taskId: string
): Promise<TripoLeadEntry[]> {
  try {
    const { data, error } = await supabase
      .from('tripolead_entries')
      .select('*')
      .eq('task_id', taskId)
      .not('deleted_at', 'is', null)
      .order('deleted_at', { ascending: false });

    if (!error && data) {
      const dbIds = new Set(data.map((d: any) => d.id));
      const localTrash = getLocalEntries(taskId).filter((e) => Boolean(e.deleted_at));
      const merged = [...(data as TripoLeadEntry[])];
      localTrash.forEach((loc) => {
        if (!dbIds.has(loc.id)) {
          merged.push(loc);
        }
      });
      return merged;
    }
  } catch {}

  return getLocalEntries(taskId).filter((e) => Boolean(e.deleted_at));
}

export async function addTripoLeadEntry(
  taskId: string,
  entry: {
    hotel_name: string;
    district: string;
    area: string;
    location_link?: string;
    professional?: string;
    mobile_number?: string;
    state?: string;
  },
  userId?: string
): Promise<TripoLeadEntry> {
  const newEntry: TripoLeadEntry = {
    id: crypto.randomUUID(),
    task_id: taskId,
    hotel_name: entry.hotel_name,
    district: entry.district,
    area: entry.area,
    location_link: entry.location_link || null,
    professional: entry.professional || null,
    mobile_number: entry.mobile_number || null,
    state: entry.state || 'Tamil Nadu',
    status: null,
    approach_date: null,
    short_notes: null,
    deleted_at: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  const local = getLocalEntries(taskId);
  local.unshift(newEntry);
  saveLocalEntries(taskId, local);

  try {
    const { data, error } = await supabase
      .from('tripolead_entries')
      .insert({
        id: newEntry.id,
        task_id: taskId,
        hotel_name: newEntry.hotel_name,
        district: newEntry.district,
        area: newEntry.area,
        location_link: newEntry.location_link,
        professional: newEntry.professional,
        mobile_number: newEntry.mobile_number,
        state: newEntry.state,
        created_by: userId || null,
      })
      .select()
      .single();

    if (!error && data) {
      const updatedLocal = getLocalEntries(taskId).map((e) => (e.id === newEntry.id ? data : e));
      saveLocalEntries(taskId, updatedLocal);
      return data as TripoLeadEntry;
    }
  } catch {}

  return newEntry;
}

export async function updateTripoLeadEntry(
  taskId: string,
  entryId: string,
  updates: {
    hotel_name?: string;
    district?: string;
    area?: string;
    location_link?: string;
    professional?: string | null;
    mobile_number?: string | null;
    state?: string | null;
    status?: TripoLeadStatus | null;
    approach_date?: string | null;
    short_notes?: string | null;
  },
  userId?: string
): Promise<void> {
  const isAdmin = await checkIsAdmin(userId);
  if (!isAdmin) {
    throw new Error('Access Denied: Only Administrators can update TripO Lead entries.');
  }

  const now = new Date().toISOString();

  const local = getLocalEntries(taskId);
  const updatedLocal = local.map((item) => {
    if (item.id === entryId) {
      return {
        ...item,
        ...updates,
        updated_at: now,
      };
    }
    return item;
  });
  saveLocalEntries(taskId, updatedLocal);

  try {
    const { error } = await supabase
      .from('tripolead_entries')
      .update({
        ...updates,
        updated_at: now,
      })
      .eq('id', entryId);

    if (error) {
      throw new Error(error.message);
    }
  } catch (err: any) {
    if (err.message && err.message.includes('Access Denied')) {
      throw err;
    }
  }
}

export async function softDeleteTripoLeadEntry(
  taskId: string,
  entryId: string,
  userId?: string
): Promise<void> {
  const isAdmin = await checkIsAdmin(userId);
  if (!isAdmin) {
    throw new Error('Access Denied: Only Administrators can delete TripO Lead entries.');
  }

  const now = new Date().toISOString();

  const local = getLocalEntries(taskId);
  const updatedLocal = local.map((item) => {
    if (item.id === entryId) {
      return { ...item, deleted_at: now, updated_at: now };
    }
    return item;
  });
  saveLocalEntries(taskId, updatedLocal);

  try {
    const { error } = await supabase
      .from('tripolead_entries')
      .update({ deleted_at: now, updated_at: now })
      .eq('id', entryId);

    if (error) {
      throw new Error(error.message);
    }
  } catch (err: any) {
    if (err.message && err.message.includes('Access Denied')) {
      throw err;
    }
  }
}

export async function restoreTripoLeadEntry(taskId: string, entryId: string): Promise<void> {
  const now = new Date().toISOString();

  const local = getLocalEntries(taskId).map((e) =>
    e.id === entryId ? { ...e, deleted_at: null, updated_at: now } : e
  );
  saveLocalEntries(taskId, local);

  try {
    await supabase
      .from('tripolead_entries')
      .update({ deleted_at: null, updated_at: now })
      .eq('id', entryId);
  } catch {}
}

export async function permanentDeleteTripoLeadEntry(taskId: string, entryId: string, userId?: string): Promise<void> {
  const isAdmin = await checkIsAdmin(userId);
  if (!isAdmin) {
    throw new Error('Access Denied: Only Administrators can delete TripO Lead entries.');
  }

  const local = getLocalEntries(taskId).filter((e) => e.id !== entryId);
  saveLocalEntries(taskId, local);

  try {
    await supabase
      .from('tripolead_entries')
      .delete()
      .eq('id', entryId);
  } catch {}
}
