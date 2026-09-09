const bcrypt = require('bcryptjs');

// Synchronously seed default demo user
const salt = bcrypt.genSaltSync(10);
const passwordHash = bcrypt.hashSync('Password123!', salt);

const users = [
  {
    id: 'usr_demo_101',
    name: 'Captain Rajesh Kumar',
    email: 'demo@orca.marine',
    passwordHash: passwordHash,
    role: 'fisherman',
    organization: 'Western Coastal Fisheries Co-op',
    vesselName: 'Matsya Sagar IV (IND-MH-02-1984)',
    preferredSector: 'Arabian Sea / Mumbai Coast',
    createdAt: new Date().toISOString()
  }
];

const UserModel = {
  async findByEmail(email) {
    if (!email) return null;
    return users.find(u => u.email.toLowerCase() === email.toLowerCase().trim()) || null;
  },

  async findById(id) {
    if (!id) return null;
    return users.find(u => u.id === id) || null;
  },

  async create({ name, email, password, role = 'fisherman', organization = '', vesselName = '', preferredSector = 'Arabian Sea / Mumbai Coast' }) {
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);
    
    const newUser = {
      id: `usr_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
      name: name.trim(),
      email: email.toLowerCase().trim(),
      passwordHash,
      role,
      organization: organization.trim(),
      vesselName: vesselName.trim(),
      preferredSector,
      createdAt: new Date().toISOString()
    };

    users.push(newUser);
    return newUser;
  },

  async comparePassword(candidatePassword, passwordHash) {
    return await bcrypt.compare(candidatePassword, passwordHash);
  },

  sanitizeUser(user) {
    if (!user) return null;
    const { passwordHash, ...sanitized } = user;
    return sanitized;
  }
};

module.exports = UserModel;
