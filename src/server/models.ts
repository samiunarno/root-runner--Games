import mongoose from 'mongoose';

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  console.warn('MONGODB_URI is not defined. Falling back to local JSON DB if configured, but MongoDB models will fail.');
}

const UserSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  email: { type: String },
  role: { type: String, default: 'user' },
  character: { type: String, default: 'boy' },
  unlockedCharacters: { type: [String], default: ['boy', 'nerd'] },
  skills: { type: Number, default: 0 },
  highScore: { type: Number, default: 0 },
  isBanned: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now }
}, {
  toJSON: {
    virtuals: true,
    versionKey: false,
    transform: (doc, ret: any) => {
      ret.id = ret._id;
      delete ret._id;
    }
  }
});

const SettingsSchema = new mongoose.Schema({
  baseSpeed: { type: Number, default: 15 },
  spawnRate: { type: Number, default: 0.8 },
  difficultyMultiplier: { type: Number, default: 1.1 }
}, {
  toJSON: { virtuals: true, versionKey: false, transform: (doc, ret: any) => { ret.id = ret._id; delete ret._id; } }
});

const LeaderboardSchema = new mongoose.Schema({
  name: { type: String, required: true },
  score: { type: Number, required: true },
  character: { type: String },
  createdAt: { type: Date, default: Date.now }
}, {
  toJSON: { virtuals: true, versionKey: false, transform: (doc, ret: any) => { ret.id = ret._id; delete ret._id; } }
});

export interface IUser extends mongoose.Document {
  username: string;
  password: string;
  email?: string;
  role: string;
  character: string;
  unlockedCharacters: string[];
  skills: number;
  highScore: number;
  isBanned: boolean;
  createdAt: Date;
}

export interface ISettings extends mongoose.Document {
  baseSpeed: number;
  spawnRate: number;
  difficultyMultiplier: number;
}

export interface ILeaderboard extends mongoose.Document {
  name: string;
  score: number;
  character?: string;
  createdAt: Date;
}

export const User = mongoose.model<IUser>('User', UserSchema);
export const Settings = mongoose.model<ISettings>('Settings', SettingsSchema);
export const LeaderboardEntry = mongoose.model<ILeaderboard>('Leaderboard', LeaderboardSchema);

export const connectDB = async () => {
  if (mongoose.connection.readyState >= 1) return;
  if (!MONGODB_URI) return;
  
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('MongoDB Connected successfully');
    
    // Initialize default settings if not exists
    const settingsCount = await Settings.countDocuments();
    if (settingsCount === 0) {
      await Settings.create({
        baseSpeed: 15,
        spawnRate: 0.8,
        difficultyMultiplier: 1.1
      });
      console.log('Default settings initialized in MongoDB');
    }
  } catch (err) {
    console.error('MongoDB Connection Error:', err);
  }
};
