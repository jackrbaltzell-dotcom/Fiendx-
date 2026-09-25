import React, { useState, useEffect } from 'react';
import {
  Users,
  Calendar,
  MessageSquare,
  Heart,
  Share2,
  Plus,
  MapPin,
  Check,
  Send,
  Camera,
  Sparkles,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { Post, Comment, Community, EventItem } from '../types';
import { dbService } from '../services/dbService';

interface CommunityPageProps {
  onOpenAuth: () => void;
  onOpenAdd: () => void;
}

export const CommunityPage: React.FC<CommunityPageProps> = ({ onOpenAuth, onOpenAdd }) => {
  const { user, profile } = useAuth();
  const [activeTab, setActiveTab] = useState<'feed' | 'communities' | 'events'>('feed');

  // Posts state
  const [posts, setPosts] = useState<Post[]>([]);
  const [newPostContent, setNewPostContent] = useState('');
  const [newPostImage, setNewPostImage] = useState('');
  const [posting, setPosting] = useState(false);

  // Active comments modal / drawer
  const [activeCommentsPostId, setActiveCommentsPostId] = useState<string | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [commentInput, setCommentInput] = useState('');

  // Communities state
  const [communities, setCommunities] = useState<Community[]>([]);
  const [joinedMap, setJoinedMap] = useState<Record<string, boolean>>({});

  // Events state
  const [events, setEvents] = useState<EventItem[]>([]);
  const [rsvpedMap, setRsvpedMap] = useState<Record<string, boolean>>({});

  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    try {
      const [fetchedPosts, fetchedCommunities, fetchedEvents] = await Promise.all([
        dbService.getPosts(),
        dbService.getCommunities(),
        dbService.getEvents(),
      ]);
      setPosts(fetchedPosts);
      setCommunities(fetchedCommunities);
      setEvents(fetchedEvents);

      // Check user memberships
      if (user) {
        const jMap: Record<string, boolean> = {};
        for (const c of fetchedCommunities) {
          jMap[c.id] = await dbService.isCommunityMember(user.uid, c.id);
        }
        setJoinedMap(jMap);
      }
    } catch (e) {
      console.error('Error loading community data:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [user]);

  // Handle Create Post
  const handleCreatePost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !profile) {
      onOpenAuth();
      return;
    }
    if (!newPostContent.trim()) return;

    setPosting(true);
    try {
      await dbService.createPost({
        userId: user.uid,
        userFullName: profile.fullName,
        userUsername: profile.username,
        userPhoto: profile.photoURL,
        content: newPostContent.trim(),
        imageUrl: newPostImage || undefined,
      });
      setNewPostContent('');
      setNewPostImage('');
      const updated = await dbService.getPosts();
      setPosts(updated);
    } finally {
      setPosting(false);
    }
  };

  // Handle Like Post
  const handleLike = async (post: Post) => {
    if (!user || !profile) {
      onOpenAuth();
      return;
    }
    const liked = await dbService.toggleLikePost(user.uid, post.id, post.userId, profile.fullName);
    setPosts((prev) =>
      prev.map((p) =>
        p.id === post.id
          ? { ...p, likesCount: liked ? p.likesCount + 1 : Math.max(0, p.likesCount - 1) }
          : p
      )
    );
  };

  // Open Comments
  const handleOpenComments = async (postId: string) => {
    setActiveCommentsPostId(postId);
    const comms = await dbService.getComments(postId);
    setComments(comms);
  };

  // Submit Comment
  const handleAddComment = async (e: React.FormEvent, post: Post) => {
    e.preventDefault();
    if (!user || !profile) {
      onOpenAuth();
      return;
    }
    if (!commentInput.trim()) return;

    const text = commentInput.trim();
    setCommentInput('');
    await dbService.addComment(
      post.id,
      {
        postId: post.id,
        userId: user.uid,
        userFullName: profile.fullName,
        userUsername: profile.username,
        userPhoto: profile.photoURL,
        text,
      },
      post.userId
    );

    const updatedComms = await dbService.getComments(post.id);
    setComments(updatedComms);
    setPosts((prev) =>
      prev.map((p) => (p.id === post.id ? { ...p, commentsCount: p.commentsCount + 1 } : p))
    );
  };

  // Toggle Join Community
  const handleToggleJoin = async (community: Community) => {
    if (!user) {
      onOpenAuth();
      return;
    }
    const joined = await dbService.toggleJoinCommunity(user.uid, community.id);
    setJoinedMap((prev) => ({ ...prev, [community.id]: joined }));
    setCommunities((prev) =>
      prev.map((c) =>
        c.id === community.id
          ? { ...c, membersCount: joined ? c.membersCount + 1 : Math.max(0, c.membersCount - 1) }
          : c
      )
    );
  };

  // Toggle RSVP Event
  const handleToggleRSVP = async (event: EventItem) => {
    if (!user) {
      onOpenAuth();
      return;
    }
    const rsvped = await dbService.rsvpEvent(user.uid, event.id);
    setRsvpedMap((prev) => ({ ...prev, [event.id]: rsvped }));
    setEvents((prev) =>
      prev.map((e) =>
        e.id === event.id
          ? { ...e, attendeesCount: rsvped ? e.attendeesCount + 1 : Math.max(0, e.attendeesCount - 1) }
          : e
      )
    );
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            Community & Social Feed
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Connect with local area groups, neighborhood discussions, and community meetups.
          </p>
        </div>

        {/* Tab switch */}
        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl self-start sm:self-auto border border-slate-200">
          {[
            { id: 'feed', label: 'Social Feed', icon: MessageSquare },
            { id: 'communities', label: 'Local Hubs', icon: Users },
            { id: 'events', label: 'Events & Meetups', icon: Calendar },
          ].map((tab) => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  active
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 1. SOCIAL FEED TAB */}
      {activeTab === 'feed' && (
        <div className="space-y-5">
          {/* Post Creator Box */}
          <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-sm space-y-3">
            <div className="flex items-start gap-3">
              <img
                src={
                  profile?.photoURL ||
                  `https://api.dicebear.com/7.x/avataaars/svg?seed=${profile?.username || 'user'}`
                }
                alt="User"
                className="w-10 h-10 rounded-full object-cover shrink-0"
              />
              <textarea
                rows={3}
                value={newPostContent}
                onChange={(e) => setNewPostContent(e.target.value)}
                placeholder="What is happening in your area? Share news, recommendations, or community updates..."
                className="w-full text-xs sm:text-sm text-slate-800 placeholder:text-slate-400 outline-hidden resize-none border-b border-slate-100 pb-2"
              />
            </div>

            {newPostImage && (
              <div className="relative w-36 h-24 rounded-xl overflow-hidden border border-slate-200 shadow-xs">
                <img src={newPostImage} alt="Upload" className="w-full h-full object-cover" />
                <button
                  type="button"
                  onClick={() => setNewPostImage('')}
                  className="absolute top-1 right-1 p-0.5 bg-black/60 text-white rounded-full"
                >
                  ✕
                </button>
              </div>
            )}

            <div className="flex items-center justify-between pt-2 border-t border-slate-100">
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={newPostImage}
                  onChange={(e) => setNewPostImage(e.target.value)}
                  placeholder="Optional image URL..."
                  className="px-3 py-1.5 text-xs border border-slate-200 rounded-xl outline-hidden w-44 sm:w-60"
                />
              </div>

              <button
                type="button"
                onClick={handleCreatePost}
                disabled={posting || !newPostContent.trim()}
                className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-xs transition-all active:scale-95 disabled:opacity-50"
              >
                {posting ? 'Posting...' : 'Post to Community'}
              </button>
            </div>
          </div>

          {/* Posts List */}
          {posts.length === 0 ? (
            <div className="p-12 text-center bg-slate-50 border border-dashed border-slate-300 rounded-3xl text-slate-400 text-xs">
              No community posts yet. Share the first update!
            </div>
          ) : (
            posts.map((post) => (
              <div
                key={post.id}
                className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3"
              >
                {/* Author row */}
                <div className="flex items-center gap-3">
                  <img
                    src={
                      post.userPhoto ||
                      `https://api.dicebear.com/7.x/avataaars/svg?seed=${post.userUsername}`
                    }
                    alt={post.userFullName}
                    className="w-10 h-10 rounded-full object-cover border border-slate-200"
                  />
                  <div>
                    <h4 className="font-bold text-xs sm:text-sm text-slate-900">{post.userFullName}</h4>
                    <p className="text-[11px] text-slate-400">
                      @{post.userUsername} • {new Date(post.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>

                {/* Content */}
                <p className="text-xs sm:text-sm text-slate-800 leading-relaxed whitespace-pre-line">
                  {post.content}
                </p>

                {post.imageUrl && (
                  <div className="rounded-2xl overflow-hidden max-h-96 bg-slate-900">
                    <img
                      src={post.imageUrl}
                      alt="Post visual"
                      className="w-full h-full object-cover"
                      loading="lazy"
                    />
                  </div>
                )}

                {/* Actions: Like, Comment */}
                <div className="pt-2 border-t border-slate-100 flex items-center gap-4 text-xs font-semibold text-slate-500">
                  <button
                    type="button"
                    onClick={() => handleLike(post)}
                    className="flex items-center gap-1.5 hover:text-rose-600 transition-colors"
                  >
                    <Heart className="w-4 h-4" />
                    <span>{post.likesCount}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleOpenComments(post.id)}
                    className="flex items-center gap-1.5 hover:text-blue-600 transition-colors"
                  >
                    <MessageSquare className="w-4 h-4" />
                    <span>{post.commentsCount} Comments</span>
                  </button>
                </div>

                {/* Inline Comments Section */}
                {activeCommentsPostId === post.id && (
                  <div className="pt-3 border-t border-slate-100 space-y-2">
                    <form
                      onSubmit={(e) => handleAddComment(e, post)}
                      className="flex items-center gap-2"
                    >
                      <input
                        type="text"
                        value={commentInput}
                        onChange={(e) => setCommentInput(e.target.value)}
                        placeholder="Write a comment..."
                        className="flex-1 px-3 py-1.5 text-xs border border-slate-200 rounded-xl outline-hidden"
                      />
                      <button
                        type="submit"
                        className="p-1.5 bg-blue-600 text-white rounded-xl shadow-xs"
                      >
                        <Send className="w-3.5 h-3.5" />
                      </button>
                    </form>

                    <div className="space-y-2 mt-2 max-h-48 overflow-y-auto">
                      {comments.map((c) => (
                        <div key={c.id} className="p-2 bg-slate-50 rounded-xl text-xs space-y-0.5">
                          <span className="font-bold text-slate-800">{c.userFullName}: </span>
                          <span className="text-slate-600">{c.text}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      )}

      {/* 2. LOCAL HUBS / COMMUNITIES TAB */}
      {activeTab === 'communities' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-600">
              Active Regional & Interest Hubs ({communities.length})
            </span>
            <button
              onClick={onOpenAdd}
              className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-xs"
            >
              + Create Community Hub
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {communities.length === 0 ? (
              <div className="col-span-2 text-center py-12 bg-slate-50 rounded-3xl text-xs text-slate-500">
                No community hubs created yet. Be the first to start a local hub!
              </div>
            ) : (
              communities.map((comm) => {
                const isJoined = Boolean(joinedMap[comm.id]);
                return (
                  <div
                    key={comm.id}
                    className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
                        <span className="font-bold text-blue-600 uppercase tracking-wider text-[10px]">
                          {comm.category}
                        </span>
                        <span className="flex items-center gap-1">
                          <Users className="w-3 h-3 text-slate-400" />
                          {comm.membersCount} members
                        </span>
                      </div>
                      <h3 className="font-bold text-base text-slate-900">{comm.name}</h3>
                      <p className="text-xs text-slate-500 line-clamp-2 mt-1">{comm.description}</p>
                      <p className="text-[11px] text-slate-400 flex items-center gap-1 mt-2">
                        <MapPin className="w-3 h-3 text-slate-400" /> {comm.location}
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleToggleJoin(comm)}
                      className={`mt-4 w-full py-2 rounded-xl text-xs font-bold transition-all ${
                        isJoined
                          ? 'bg-slate-100 text-slate-700 hover:bg-rose-50 hover:text-rose-600'
                          : 'bg-blue-600 hover:bg-blue-700 text-white shadow-xs'
                      }`}
                    >
                      {isJoined ? 'Joined (Click to Leave)' : 'Join Hub'}
                    </button>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* 3. EVENTS & MEETUPS TAB */}
      {activeTab === 'events' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-600">
              Upcoming Events ({events.length})
            </span>
            <button
              onClick={onOpenAdd}
              className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-xs"
            >
              + Create Event
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {events.length === 0 ? (
              <div className="col-span-2 text-center py-12 bg-slate-50 rounded-3xl text-xs text-slate-500">
                No upcoming events posted yet. Schedule a meetup or gathering!
              </div>
            ) : (
              events.map((ev) => {
                const isRsvped = Boolean(rsvpedMap[ev.id]);
                return (
                  <div
                    key={ev.id}
                    className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-center gap-2 text-xs text-blue-600 font-bold mb-1">
                        <Calendar className="w-3.5 h-3.5" />
                        <span>{ev.date} at {ev.time}</span>
                      </div>
                      <h3 className="font-bold text-base text-slate-900">{ev.title}</h3>
                      <p className="text-xs text-slate-500 line-clamp-2 mt-1">{ev.description}</p>
                      <div className="mt-3 flex items-center justify-between text-xs text-slate-400">
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3.5 h-3.5 text-slate-400" />
                          {ev.location}
                        </span>
                        <span className="font-semibold text-slate-600">
                          {ev.attendeesCount} RSVP'd
                        </span>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleToggleRSVP(ev)}
                      className={`mt-4 w-full py-2 rounded-xl text-xs font-bold transition-all ${
                        isRsvped
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : 'bg-slate-900 hover:bg-blue-600 text-white shadow-xs'
                      }`}
                    >
                      {isRsvped ? '✓ RSVP Confirmed' : 'RSVP to Attend'}
                    </button>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
};
