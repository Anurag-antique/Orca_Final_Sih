// const bcrypt = require('bcryptjs');

// // Synchronously seed default demo user
// const salt = bcrypt.genSaltSync(10);
// const passwordHash = bcrypt.hashSync('Password123!', salt);

// const users = [
//   {
//     id: 'usr_demo_101',
//     name: 'Captain Rajesh Kumar',
//     email: 'demo@orca.marine',
//     passwordHash: passwordHash,
//     role: 'fisherman',
//     organization: 'Western Coastal Fisheries Co-op',
//     vesselName: 'Matsya Sagar IV (IND-MH-02-1984)',
//     preferredSector: 'Arabian Sea / Mumbai Coast',
//     createdAt: new Date().toISOString()
//   }
// ];

// const UserModel = {
//   async findByEmail(email) {
//     if (!email) return null;
//     return users.find(u => u.email.toLowerCase() === email.toLowerCase().trim()) || null;
//   },

//   async findById(id) {
//     if (!id) return null;
//     return users.find(u => u.id === id) || null;
//   },

//   async create({ name, email, password, role = 'fisherman', organization = '', vesselName = '', preferredSector = 'Arabian Sea / Mumbai Coast' }) {
//     const salt = await bcrypt.genSalt(10);
//     const passwordHash = await bcrypt.hash(password, salt);

//     const newUser = {
//       id: `usr_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
//       name: name.trim(),
//       email: email.toLowerCase().trim(),
//       passwordHash,
//       role,
//       organization: organization.trim(),
//       vesselName: vesselName.trim(),
//       preferredSector,
//       createdAt: new Date().toISOString()
//     };

//     users.push(newUser);
//     return newUser;
//   },

//   async comparePassword(candidatePassword, passwordHash) {
//     return await bcrypt.compare(candidatePassword, passwordHash);
//   },

//   sanitizeUser(user) {
//     if (!user) return null;
//     const { passwordHash, ...sanitized } = user;
//     return sanitized;
//   }
// };

// module.exports = UserModel;

const bcrypt = require("bcryptjs");
const supabase = require("../config/supabase");

const UserModel = {
  async findByEmail(email) {
    if (!email) return null;

    const { data, error } = await supabase
      .from("users")
      .select("*")
      .ilike("email", email.trim())
      .maybeSingle();

    if (error) {
      console.error("[UserModel.findByEmail]", error.message);
      throw new Error("Database error while finding user by email.");
    }

    return data ? mapToUser(data) : null;
  },

  async findById(id) {
    if (!id) return null;

    const { data, error } = await supabase
      .from("users")
      .select("*")
      .eq("id", id)
      .maybeSingle();

    if (error) {
      console.error("[UserModel.findById]", error.message);
      throw new Error("Database error while finding user by id.");
    }

    return data ? mapToUser(data) : null;
  },

  async create({
    name,
    email,
    password,
    role = "fisherman",
    organization = "",
    vesselName = "",
    preferredSector = "Arabian Sea / Mumbai Coast",
  }) {
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    const { data, error } = await supabase
      .from("users")
      .insert({
        name: name.trim(),
        email: email.toLowerCase().trim(),
        password_hash: passwordHash,
        role,
        organization: organization.trim(),
        vessel_name: vesselName.trim(),
        preferred_sector: preferredSector,
      })
      .select()
      .single();

    if (error) {
      if (error.code === "23505") {
        const dupErr = new Error("A user with this email already exists.");
        dupErr.statusCode = 409;
        throw dupErr;
      }
      console.error("[UserModel.create]", error.message);
      throw new Error("Database error while creating user.");
    }

    return mapToUser(data);
  },

  async comparePassword(candidatePassword, passwordHash) {
    return bcrypt.compare(candidatePassword, passwordHash);
  },

  sanitizeUser(user) {
    if (!user) return null;
    const { passwordHash, ...sanitized } = user;
    return sanitized;
  },
};

/**
 * Maps Supabase snake_case row → existing camelCase app shape.
 * This keeps the API contract and frontend unchanged.
 */
function mapToUser(row) {
  if (!row) return null;
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    passwordHash: row.password_hash,
    role: row.role,
    organization: row.organization,
    vesselName: row.vessel_name,
    preferredSector: row.preferred_sector,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

module.exports = UserModel;
