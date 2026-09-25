import React, { useState, useEffect } from 'react';
import {
  MapPin,
  Globe,
  Phone,
  Mail,
  Share2,
  UserPlus,
  UserCheck,
  MessageSquare,
  ShieldCheck,
  CheckCircle2,
  Edit3,
  Star,
  Building,
  Heart,
  Calendar,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { UserProfile, Listing, Post, Review } from '../types';
import { dbService } from '../services/dbService';
import { ListingCard } from '../components/ListingCard';
import { ShareProfileModal } from '../components/ActionModals';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../config/firebase';

interface ProfilePageProps {
  targetUsername?: string;
  onOpenDetails: (listing: Listing) => void;
  onOpenAuth: () => void;
  onContactUser: (targetUser: { uid: string; fullName: string; username: string; photoURL?: string }) => void;
}

export const ProfilePage: React.FC<ProfilePageProps> = ({
  targetUsername,
  onOpenDetails,
  onOpenAuth,
  onContactUser,
}) => {
  const { user, profile: myProfile, updateProfileData } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [listings, setListings] = useState<Listing[]>([]);
  const [posts, setPosts] = useState<Post[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [isFollowing, setIsFollowing] = useState(false);
  const [activeTab, setActiveTab] = useState<'listings' | 'posts' | 'reviews' | 'about'>('listings');
  const [shareOpen, setShareOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  // Edit form state
  const [editName, setEditName] = useState('');
  const [editBio, setEditBio] = useState('');
  const [editProfession, setEditProfession] = useState('');
  const [editLocation, setEditLocation] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editWebsite, setEditWebsite] = useState('');

  const isMe =
    (!targetUsername && myProfile) ||
    (targetUsername && myProfile?.username.toLowerCase() === targetUsername.toLowerCase());

  useEffect(() => {
    const fetchProfileData = async () => {
      setLoading(true);
      try {
        let targetUserProf: UserProfile | null = null;
        if (isMe && myProfile) {
          targetUserProf = myProfile;
        } else if (targetUsername) {
          // Query user by username
          const q = query(
            collection(db, 'users'),
            where('username', '==', targetUsername.toLowerCase())
          );
          const snap = await getDocs(q);
          if (!snap.empty) {
            targetUserProf = snap.docs[0].data() as UserProfile;
          }
        }

        if (targetUserProf) {
          setProfile(targetUserProf);
          setEditName(targetUserProf.fullName);
          setEditBio(targetUserProf.bio || '');
          setEditProfession(targetUserProf.profession || '');
          setEditLocation(targetUserProf.location || '');
          setEditPhone(targetUserProf.phone || '');
          setEditWebsite(targetUserProf.website || '');

          // Load target user's listings
          const listingsQ = query(
            collection(db, 'listings'),
            where('userId', '==', targetUserProf.uid)
          );
          const lSnap = await getDocs(listingsQ);
          const userListings: Listing[] = [];
          lSnap.forEach((d) => userListings.push({ id: d.id, ...d.data() } as Listing));
          setListings(userListings);

          // Load user posts
          const postsQ = query(collection(db, 'posts'), where('userId', '==', targetUserProf.uid));
          const pSnap = await getDocs(postsQ);
          const userPosts: Post[] = [];
          pSnap.forEach((d) => userPosts.push({ id: d.id, ...d.data() } as Post));
          setPosts(userPosts);

          // Load user reviews
          const revs = await dbService.getReviews(targetUserProf.uid);
          setReviews(revs);

          // Check if following
          if (user && !isMe) {
            const following = await dbService.isFollowing(user.uid, targetUserProf.uid);
            setIsFollowing(following);
          }
        }
      } catch (e) {
        console.error('Error fetching profile:', e);
      } finally {
        setLoading(false);
      }
    };

    fetchProfileData();
  }, [targetUsername, isMe, myProfile]);

  const handleToggleFollow = async () => {
    if (!user) {
      onOpenAuth();
      return;
    }
    if (!profile) return;
    const followed = await dbService.toggleFollow(user.uid, profile.uid);
    setIsFollowing(followed);
    setProfile((prev) =>
      prev
        ? {
            ...prev,
            followersCount: followed ? prev.followersCount + 1 : Math.max(0, prev.followersCount - 1),
          }
        : null
    );
  };

  const handleSaveProfileEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    await updateProfileData({
      fullName: editName,
      bio: editBio,
      profession: editProfession,
      location: editLocation,
      phone: editPhone,
      website: editWebsite,
    });
    setEditOpen(false);
  };

  if (loading) {
    return <div className="text-xs text-slate-400 py-16 text-center">Loading profile card...</div>;
  }

  if (!profile) {
    return (
      <div className="text-center py-16 bg-slate-50 rounded-3xl max-w-md mx-auto my-8">
        <h3 className="font-bold text-slate-800">Profile Not Found</h3>
        <p className="text-xs text-slate-500 mt-1">This user does not exist or has been removed.</p>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 space-y-6">
      {/* Cover & Avatar Header */}
      <div className="relative bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        {/* Cover Photo */}
        <div className="h-44 sm:h-60 w-full bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-950 overflow-hidden">
          {profile.coverURL && (
            <img
              src={profile.coverURL}
              alt="Cover"
              className="w-full h-full object-cover opacity-75"
            />
          )}
        </div>

        {/* Profile Info Bar */}
        <div className="px-6 pb-6 pt-0 relative flex flex-col sm:flex-row items-center sm:items-end justify-between gap-4 -mt-16 sm:-mt-20">
          <div className="flex flex-col sm:flex-row items-center sm:items-end gap-4 text-center sm:text-left">
            <img
              src={
                profile.photoURL ||
                `https://api.dicebear.com/7.x/avataaars/svg?seed=${profile.username}`
              }
              alt={profile.fullName}
              className="w-28 h-28 sm:w-32 sm:h-32 rounded-3xl object-cover border-4 border-white shadow-xl bg-white"
            />
            <div>
              <div className="flex items-center justify-center sm:justify-start gap-1.5 mt-2">
                <h1 className="text-xl sm:text-2xl font-black text-slate-900">{profile.fullName}</h1>
                {profile.verifications?.identityVerified && (
                  <CheckCircle2 className="w-5 h-5 text-blue-600 shrink-0" />
                )}
              </div>
              <p className="text-xs font-semibold text-blue-600">@{profile.username}</p>
              {profile.profession && (
                <p className="text-xs font-bold text-slate-700 mt-0.5">{profile.profession}</p>
              )}
              {profile.location && (
                <p className="text-[11px] text-slate-500 flex items-center justify-center sm:justify-start gap-1 mt-0.5">
                  <MapPin className="w-3 h-3 text-slate-400" />
                  {profile.location}
                </p>
              )}
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-2">
            {isMe ? (
              <button
                type="button"
                onClick={() => setEditOpen(true)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs rounded-xl transition-colors flex items-center gap-1.5"
              >
                <Edit3 className="w-3.5 h-3.5" />
                Edit Profile
              </button>
            ) : (
              <>
                <button
                  type="button"
                  onClick={handleToggleFollow}
                  className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all ${
                    isFollowing
                      ? 'bg-slate-100 text-slate-700'
                      : 'bg-blue-600 hover:bg-blue-700 text-white shadow-xs'
                  }`}
                >
                  {isFollowing ? <UserCheck className="w-3.5 h-3.5" /> : <UserPlus className="w-3.5 h-3.5" />}
                  {isFollowing ? 'Following' : 'Follow'}
                </button>

                <button
                  type="button"
                  onClick={() =>
                    onContactUser({
                      uid: profile.uid,
                      fullName: profile.fullName,
                      username: profile.username,
                      photoURL: profile.photoURL,
                    })
                  }
                  className="px-4 py-2 bg-slate-900 hover:bg-blue-600 text-white rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5"
                >
                  <MessageSquare className="w-3.5 h-3.5" />
                  Message
                </button>
              </>
            )}

            <button
              type="button"
              onClick={() => setShareOpen(true)}
              className="p-2 border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl transition-colors"
              title="Share Digital Business Card"
            >
              <Share2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Roles & Follower counts */}
        <div className="px-6 py-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3 bg-slate-50/50 text-xs">
          <div className="flex items-center gap-2">
            <span className="text-slate-500">Roles:</span>
            <div className="flex flex-wrap gap-1">
              {profile.roles?.map((r) => (
                <span
                  key={r}
                  className="px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 font-semibold text-[10px] uppercase"
                >
                  {r.replace('_', ' ')}
                </span>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-4 text-slate-600 font-semibold">
            <span>
              <b className="text-slate-900">{profile.followersCount || 0}</b> Followers
            </span>
            <span>
              <b className="text-slate-900">{profile.followingCount || 0}</b> Following
            </span>
            <span>
              <b className="text-slate-900">{listings.length}</b> Listings
            </span>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200">
        {[
          { id: 'listings', label: `Listings (${listings.length})` },
          { id: 'posts', label: `Feed Posts (${posts.length})` },
          { id: 'reviews', label: `Reviews (${reviews.length})` },
          { id: 'about', label: 'About & Contact' },
        ].map((tab) => {
          const active = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`pb-3 px-2 text-xs font-bold border-b-2 transition-all ${
                active
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-slate-500 hover:text-slate-900'
              }`}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Tab Content */}
      {activeTab === 'listings' && (
        <div>
          {listings.length === 0 ? (
            <div className="text-center py-12 bg-slate-50 rounded-2xl text-xs text-slate-400">
              No listings published by this user yet.
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {listings.map((l) => (
                <ListingCard
                  key={l.id}
                  listing={l}
                  onOpenDetails={onOpenDetails}
                  onRequireAuth={onOpenAuth}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === 'posts' && (
        <div className="space-y-4">
          {posts.length === 0 ? (
            <div className="text-center py-12 bg-slate-50 rounded-2xl text-xs text-slate-400">
              No social posts yet.
            </div>
          ) : (
            posts.map((post) => (
              <div key={post.id} className="p-4 bg-white rounded-2xl border border-slate-200 shadow-xs space-y-2">
                <p className="text-xs text-slate-800 leading-relaxed">{post.content}</p>
                {post.imageUrl && (
                  <img src={post.imageUrl} alt="Post" className="rounded-xl max-h-60 object-cover" />
                )}
                <div className="text-[10px] text-slate-400 pt-1">
                  {new Date(post.createdAt).toLocaleDateString()} • {post.likesCount} Likes • {post.commentsCount} Comments
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {activeTab === 'reviews' && (
        <div className="space-y-3">
          {reviews.length === 0 ? (
            <div className="text-center py-12 bg-slate-50 rounded-2xl text-xs text-slate-400">
              No reviews received yet.
            </div>
          ) : (
            reviews.map((rev) => (
              <div key={rev.id} className="p-4 bg-white rounded-2xl border border-slate-200 shadow-xs space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs text-slate-800">{rev.authorName}</span>
                  <div className="flex items-center gap-0.5">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        className={`w-3 h-3 ${
                          i < rev.rating ? 'fill-amber-400 text-amber-400' : 'text-slate-200'
                        }`}
                      />
                    ))}
                  </div>
                </div>
                <p className="text-xs text-slate-600">{rev.comment}</p>
              </div>
            ))
          )}
        </div>
      )}

      {activeTab === 'about' && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <div>
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Bio & Summary</h3>
            <p className="text-xs text-slate-700 mt-1 leading-relaxed">
              {profile.bio || 'No bio provided yet.'}
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-slate-100 text-xs">
            {profile.privacy.showPhone && profile.phone && (
              <div className="flex items-center gap-2 text-slate-700">
                <Phone className="w-4 h-4 text-blue-600" />
                <span>{profile.phone}</span>
              </div>
            )}
            {profile.website && (
              <div className="flex items-center gap-2 text-slate-700">
                <Globe className="w-4 h-4 text-blue-600" />
                <a href={profile.website} target="_blank" rel="noreferrer" className="text-blue-600 hover:underline">
                  {profile.website}
                </a>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Share Modal */}
      <ShareProfileModal
        isOpen={shareOpen}
        onClose={() => setShareOpen(false)}
        profile={profile}
      />

      {/* Edit Profile Modal */}
      {editOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl p-6 border border-slate-100 animate-in zoom-in-95 duration-200">
            <h3 className="text-lg font-bold text-slate-900 mb-3">Edit Profile</h3>
            <form onSubmit={handleSaveProfileEdit} className="space-y-3 text-xs">
              <div>
                <label className="font-semibold text-slate-700 block mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full p-2 border border-slate-300 rounded-xl outline-hidden"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Profession / Title</label>
                <input
                  type="text"
                  value={editProfession}
                  onChange={(e) => setEditProfession(e.target.value)}
                  placeholder="e.g. Master Electrician / Senior Architect"
                  className="w-full p-2 border border-slate-300 rounded-xl outline-hidden"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Location</label>
                <input
                  type="text"
                  value={editLocation}
                  onChange={(e) => setEditLocation(e.target.value)}
                  placeholder="e.g. Dhanmondi, Dhaka"
                  className="w-full p-2 border border-slate-300 rounded-xl outline-hidden"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Bio</label>
                <textarea
                  rows={3}
                  value={editBio}
                  onChange={(e) => setEditBio(e.target.value)}
                  placeholder="Brief about your services or interests..."
                  className="w-full p-2 border border-slate-300 rounded-xl outline-hidden"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Phone Number</label>
                <input
                  type="text"
                  value={editPhone}
                  onChange={(e) => setEditPhone(e.target.value)}
                  placeholder="+880..."
                  className="w-full p-2 border border-slate-300 rounded-xl outline-hidden"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEditOpen(false)}
                  className="px-3.5 py-1.5 text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-xs"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
