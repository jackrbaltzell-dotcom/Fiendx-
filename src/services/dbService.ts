import {
  collection,
  doc,
  addDoc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  onSnapshot,
  increment,
} from 'firebase/firestore';
import { db } from '../config/firebase';
import {
  Listing,
  Post,
  Comment,
  Conversation,
  Message,
  Notification,
  Booking,
  Review,
  JobApplication,
  FreelanceProposal,
  RequestItem,
  RequestResponse,
  Community,
  EventItem,
  VerificationRequest,
  Report,
} from '../types';

export const dbService = {
  // ===================== LISTINGS =====================
  async createListing(data: Omit<Listing, 'id' | 'createdAt' | 'updatedAt' | 'viewsCount' | 'savesCount' | 'rating' | 'reviewsCount'>): Promise<string> {
    const colRef = collection(db, 'listings');
    const newDoc = await addDoc(colRef, {
      ...data,
      viewsCount: 0,
      savesCount: 0,
      rating: 5.0,
      reviewsCount: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
    return newDoc.id;
  },

  async updateListing(id: string, data: Partial<Listing>): Promise<void> {
    const docRef = doc(db, 'listings', id);
    await updateDoc(docRef, {
      ...data,
      updatedAt: new Date().toISOString(),
    });
  },

  async deleteListing(id: string): Promise<void> {
    const docRef = doc(db, 'listings', id);
    await deleteDoc(docRef);
  },

  async getListingById(id: string): Promise<Listing | null> {
    const docRef = doc(db, 'listings', id);
    const snap = await getDoc(docRef);
    if (!snap.exists()) return null;
    return { id: snap.id, ...snap.data() } as Listing;
  },

  async getListings(typeFilter?: string, categoryFilter?: string, searchLocation?: string): Promise<Listing[]> {
    const colRef = collection(db, 'listings');
    let q = query(colRef, orderBy('createdAt', 'desc'), limit(100));

    if (typeFilter && typeFilter !== 'all') {
      q = query(colRef, where('type', '==', typeFilter), orderBy('createdAt', 'desc'), limit(100));
    }

    const snap = await getDocs(q);
    let results: Listing[] = [];
    snap.forEach((d) => {
      results.push({ id: d.id, ...d.data() } as Listing);
    });

    if (categoryFilter && categoryFilter !== 'all') {
      results = results.filter((l) => l.category.toLowerCase() === categoryFilter.toLowerCase());
    }

    if (searchLocation && searchLocation.trim() !== '') {
      const locLower = searchLocation.toLowerCase();
      results = results.filter((l) => l.location.toLowerCase().includes(locLower));
    }

    return results;
  },

  async incrementListingViews(id: string): Promise<void> {
    try {
      const docRef = doc(db, 'listings', id);
      await updateDoc(docRef, { viewsCount: increment(1) });
    } catch (e) {
      console.warn('Could not increment view count', e);
    }
  },

  // ===================== SAVED ITEMS =====================
  async toggleSaveListing(userId: string, listingId: string): Promise<boolean> {
    const saveDocId = `${userId}_${listingId}`;
    const saveRef = doc(db, 'saves', saveDocId);
    const snap = await getDoc(saveRef);

    const listingRef = doc(db, 'listings', listingId);

    if (snap.exists()) {
      await deleteDoc(saveRef);
      await updateDoc(listingRef, { savesCount: increment(-1) }).catch(() => {});
      return false; // unsaved
    } else {
      await setDoc(saveRef, {
        userId,
        listingId,
        createdAt: new Date().toISOString(),
      });
      await updateDoc(listingRef, { savesCount: increment(1) }).catch(() => {});
      return true; // saved
    }
  },

  async isListingSaved(userId: string, listingId: string): Promise<boolean> {
    const saveDocId = `${userId}_${listingId}`;
    const saveRef = doc(db, 'saves', saveDocId);
    const snap = await getDoc(saveRef);
    return snap.exists();
  },

  async getUserSavedListings(userId: string): Promise<Listing[]> {
    const q = query(collection(db, 'saves'), where('userId', '==', userId));
    const snap = await getDocs(q);
    const listingIds: string[] = [];
    snap.forEach((d) => listingIds.push(d.data().listingId));

    if (listingIds.length === 0) return [];

    const listings: Listing[] = [];
    for (const lid of listingIds) {
      const lSnap = await getDoc(doc(db, 'listings', lid));
      if (lSnap.exists()) {
        listings.push({ id: lSnap.id, ...lSnap.data() } as Listing);
      }
    }
    return listings;
  },

  // ===================== FOLLOWS =====================
  async toggleFollow(followerId: string, followingId: string): Promise<boolean> {
    if (followerId === followingId) return false;
    const followId = `${followerId}_${followingId}`;
    const followRef = doc(db, 'follows', followId);
    const snap = await getDoc(followRef);

    const followerUserRef = doc(db, 'users', followerId);
    const targetUserRef = doc(db, 'users', followingId);

    if (snap.exists()) {
      await deleteDoc(followRef);
      await updateDoc(followerUserRef, { followingCount: increment(-1) }).catch(() => {});
      await updateDoc(targetUserRef, { followersCount: increment(-1) }).catch(() => {});
      return false; // unfollowed
    } else {
      await setDoc(followRef, {
        followerId,
        followingId,
        createdAt: new Date().toISOString(),
      });
      await updateDoc(followerUserRef, { followingCount: increment(1) }).catch(() => {});
      await updateDoc(targetUserRef, { followersCount: increment(1) }).catch(() => {});

      // trigger notification
      const followerSnap = await getDoc(followerUserRef);
      const followerData = followerSnap.data();
      await this.createNotification({
        userId: followingId,
        type: 'follow',
        actorId: followerId,
        actorName: followerData?.fullName || 'Someone',
        actorPhoto: followerData?.photoURL,
        title: 'New Follower',
        message: `${followerData?.fullName || 'Someone'} started following your profile.`,
        link: `/@${followerData?.username || followerId}`,
        read: false,
      });

      return true; // followed
    }
  },

  async isFollowing(followerId: string, followingId: string): Promise<boolean> {
    const followId = `${followerId}_${followingId}`;
    const followRef = doc(db, 'follows', followId);
    const snap = await getDoc(followRef);
    return snap.exists();
  },

  // ===================== SOCIAL POSTS & COMMENTS =====================
  async createPost(data: Omit<Post, 'id' | 'createdAt' | 'likesCount' | 'commentsCount' | 'sharesCount'>): Promise<string> {
    const colRef = collection(db, 'posts');
    const docRef = await addDoc(colRef, {
      ...data,
      likesCount: 0,
      commentsCount: 0,
      sharesCount: 0,
      createdAt: new Date().toISOString(),
    });
    return docRef.id;
  },

  async getPosts(): Promise<Post[]> {
    const q = query(collection(db, 'posts'), orderBy('createdAt', 'desc'), limit(50));
    const snap = await getDocs(q);
    const posts: Post[] = [];
    snap.forEach((d) => posts.push({ id: d.id, ...d.data() } as Post));
    return posts;
  },

  async toggleLikePost(userId: string, postId: string, postAuthorId: string, userName: string): Promise<boolean> {
    const likeId = `${userId}_${postId}`;
    const likeRef = doc(db, 'likes', likeId);
    const snap = await getDoc(likeRef);
    const postRef = doc(db, 'posts', postId);

    if (snap.exists()) {
      await deleteDoc(likeRef);
      await updateDoc(postRef, { likesCount: increment(-1) }).catch(() => {});
      return false;
    } else {
      await setDoc(likeRef, {
        userId,
        postId,
        createdAt: new Date().toISOString(),
      });
      await updateDoc(postRef, { likesCount: increment(1) }).catch(() => {});

      if (userId !== postAuthorId) {
        await this.createNotification({
          userId: postAuthorId,
          type: 'like',
          actorId: userId,
          actorName: userName,
          title: 'Post Liked',
          message: `${userName} liked your post.`,
          link: '/community',
          read: false,
        });
      }
      return true;
    }
  },

  async isPostLiked(userId: string, postId: string): Promise<boolean> {
    const likeId = `${userId}_${postId}`;
    const snap = await getDoc(doc(db, 'likes', likeId));
    return snap.exists();
  },

  async addComment(postId: string, commentData: Omit<Comment, 'id' | 'createdAt'>, postAuthorId: string): Promise<string> {
    const colRef = collection(db, 'comments');
    const docRef = await addDoc(colRef, {
      ...commentData,
      createdAt: new Date().toISOString(),
    });

    const postRef = doc(db, 'posts', postId);
    await updateDoc(postRef, { commentsCount: increment(1) }).catch(() => {});

    if (commentData.userId !== postAuthorId) {
      await this.createNotification({
        userId: postAuthorId,
        type: 'comment',
        actorId: commentData.userId,
        actorName: commentData.userFullName,
        actorPhoto: commentData.userPhoto,
        title: 'New Comment',
        message: `${commentData.userFullName} commented on your post.`,
        link: '/community',
        read: false,
      });
    }

    return docRef.id;
  },

  async getComments(postId: string): Promise<Comment[]> {
    const q = query(collection(db, 'comments'), where('postId', '==', postId), orderBy('createdAt', 'asc'));
    const snap = await getDocs(q);
    const comments: Comment[] = [];
    snap.forEach((d) => comments.push({ id: d.id, ...d.data() } as Comment));
    return comments;
  },

  async deletePost(postId: string): Promise<void> {
    await deleteDoc(doc(db, 'posts', postId));
  },

  // ===================== MESSAGING & CHAT =====================
  async getOrCreateConversation(
    currentUserId: string,
    targetUserId: string,
    currentDetails: { fullName: string; username: string; photoURL?: string },
    targetDetails: { fullName: string; username: string; photoURL?: string },
    listingContext?: { id: string; title: string }
  ): Promise<string> {
    const pairId = [currentUserId, targetUserId].sort().join('_');
    const convRef = doc(db, 'conversations', pairId);
    const snap = await getDoc(convRef);

    if (snap.exists()) {
      return snap.id;
    }

    await setDoc(convRef, {
      participantIds: [currentUserId, targetUserId],
      participantDetails: {
        [currentUserId]: currentDetails,
        [targetUserId]: targetDetails,
      },
      lastMessage: listingContext ? `Inquiring about ${listingContext.title}` : 'Started conversation',
      lastMessageTimestamp: new Date().toISOString(),
      lastSenderId: currentUserId,
      unreadCount: {
        [targetUserId]: 0,
        [currentUserId]: 0,
      },
      listingId: listingContext?.id || null,
      listingTitle: listingContext?.title || null,
    });

    return pairId;
  },

  async sendMessage(conversationId: string, senderId: string, senderName: string, text: string): Promise<void> {
    const msgCol = collection(db, 'messages');
    await addDoc(msgCol, {
      conversationId,
      senderId,
      senderName,
      text,
      read: false,
      createdAt: new Date().toISOString(),
    });

    const convRef = doc(db, 'conversations', conversationId);
    const convSnap = await getDoc(convRef);
    if (convSnap.exists()) {
      const convData = convSnap.data() as Conversation;
      const otherUser = convData.participantIds.find((id) => id !== senderId);

      const updatedUnread = { ...convData.unreadCount };
      if (otherUser) {
        updatedUnread[otherUser] = (updatedUnread[otherUser] || 0) + 1;
        // notification
        await this.createNotification({
          userId: otherUser,
          type: 'message',
          actorId: senderId,
          actorName: senderName,
          title: 'New Message',
          message: `${senderName}: ${text.slice(0, 60)}...`,
          link: '/messages',
          read: false,
        });
      }

      await updateDoc(convRef, {
        lastMessage: text,
        lastMessageTimestamp: new Date().toISOString(),
        lastSenderId: senderId,
        unreadCount: updatedUnread,
      });
    }
  },

  subscribeConversations(userId: string, callback: (convs: Conversation[]) => void) {
    const q = query(
      collection(db, 'conversations'),
      where('participantIds', 'array-contains', userId),
      orderBy('lastMessageTimestamp', 'desc')
    );
    return onSnapshot(q, (snap) => {
      const convs: Conversation[] = [];
      snap.forEach((d) => convs.push({ id: d.id, ...d.data() } as Conversation));
      callback(convs);
    });
  },

  subscribeMessages(conversationId: string, callback: (msgs: Message[]) => void) {
    const q = query(
      collection(db, 'messages'),
      where('conversationId', '==', conversationId),
      orderBy('createdAt', 'asc')
    );
    return onSnapshot(q, (snap) => {
      const msgs: Message[] = [];
      snap.forEach((d) => msgs.push({ id: d.id, ...d.data() } as Message));
      callback(msgs);
    });
  },

  // ===================== NOTIFICATIONS =====================
  async createNotification(data: Omit<Notification, 'id' | 'createdAt'>): Promise<string> {
    const colRef = collection(db, 'notifications');
    const docRef = await addDoc(colRef, {
      ...data,
      createdAt: new Date().toISOString(),
    });
    return docRef.id;
  },

  subscribeNotifications(userId: string, callback: (notifs: Notification[]) => void) {
    const q = query(
      collection(db, 'notifications'),
      where('userId', '==', userId),
      orderBy('createdAt', 'desc'),
      limit(40)
    );
    return onSnapshot(q, (snap) => {
      const notifs: Notification[] = [];
      snap.forEach((d) => notifs.push({ id: d.id, ...d.data() } as Notification));
      callback(notifs);
    });
  },

  async markNotificationRead(notifId: string): Promise<void> {
    await updateDoc(doc(db, 'notifications', notifId), { read: true });
  },

  // ===================== REVIEWS & RATINGS =====================
  async addReview(data: Omit<Review, 'id' | 'createdAt'>): Promise<string> {
    const colRef = collection(db, 'reviews');
    const docRef = await addDoc(colRef, {
      ...data,
      createdAt: new Date().toISOString(),
    });

    // Update target rating if listing
    if (data.targetType === 'listing') {
      const listingRef = doc(db, 'listings', data.targetId);
      const snap = await getDoc(listingRef);
      if (snap.exists()) {
        const curData = snap.data();
        const curCount = curData.reviewsCount || 0;
        const curRating = curData.rating || 5.0;
        const newCount = curCount + 1;
        const newRating = Number(((curRating * curCount + data.rating) / newCount).toFixed(1));
        await updateDoc(listingRef, {
          rating: newRating,
          reviewsCount: newCount,
        });
      }
    }

    return docRef.id;
  },

  async getReviews(targetId: string): Promise<Review[]> {
    const q = query(collection(db, 'reviews'), where('targetId', '==', targetId), orderBy('createdAt', 'desc'));
    const snap = await getDocs(q);
    const reviews: Review[] = [];
    snap.forEach((d) => reviews.push({ id: d.id, ...d.data() } as Review));
    return reviews;
  },

  // ===================== BOOKINGS =====================
  async createBooking(data: Omit<Booking, 'id' | 'createdAt' | 'status'>): Promise<string> {
    const colRef = collection(db, 'bookings');
    const docRef = await addDoc(colRef, {
      ...data,
      status: 'pending',
      createdAt: new Date().toISOString(),
    });

    // Notify provider
    await this.createNotification({
      userId: data.providerId,
      type: 'booking',
      actorId: data.customerId,
      actorName: data.customerName,
      title: 'New Service Booking',
      message: `${data.customerName} booked "${data.serviceTitle}" for ${data.bookingDate} at ${data.bookingTime}.`,
      link: '/dashboard',
      read: false,
    });

    return docRef.id;
  },

  async getUserBookings(userId: string): Promise<Booking[]> {
    const q1 = query(collection(db, 'bookings'), where('customerId', '==', userId), orderBy('createdAt', 'desc'));
    const q2 = query(collection(db, 'bookings'), where('providerId', '==', userId), orderBy('createdAt', 'desc'));

    const [snap1, snap2] = await Promise.all([getDocs(q1), getDocs(q2)]);
    const map = new Map<string, Booking>();
    snap1.forEach((d) => map.set(d.id, { id: d.id, ...d.data() } as Booking));
    snap2.forEach((d) => map.set(d.id, { id: d.id, ...d.data() } as Booking));

    return Array.from(map.values()).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  },

  async updateBookingStatus(bookingId: string, status: Booking['status'], notifyUserId?: string): Promise<void> {
    await updateDoc(doc(db, 'bookings', bookingId), { status });
    if (notifyUserId) {
      await this.createNotification({
        userId: notifyUserId,
        type: 'booking',
        actorId: 'system',
        actorName: 'FindX Booking',
        title: 'Booking Status Updated',
        message: `Your booking status has been updated to "${status}".`,
        link: '/dashboard',
        read: false,
      });
    }
  },

  // ===================== JOB APPLICATIONS =====================
  async applyForJob(data: Omit<JobApplication, 'id' | 'createdAt' | 'status'>): Promise<string> {
    const colRef = collection(db, 'job_applications');
    const docRef = await addDoc(colRef, {
      ...data,
      status: 'pending',
      createdAt: new Date().toISOString(),
    });

    // Notify employer
    await this.createNotification({
      userId: data.employerId,
      type: 'job_application',
      actorId: data.applicantId,
      actorName: data.applicantName,
      title: 'New Job Applicant',
      message: `${data.applicantName} applied for "${data.jobTitle}".`,
      link: '/dashboard',
      read: false,
    });

    return docRef.id;
  },

  async getApplicationsForJob(jobId: string): Promise<JobApplication[]> {
    const q = query(collection(db, 'job_applications'), where('jobId', '==', jobId), orderBy('createdAt', 'desc'));
    const snap = await getDocs(q);
    const list: JobApplication[] = [];
    snap.forEach((d) => list.push({ id: d.id, ...d.data() } as JobApplication));
    return list;
  },

  async getMyApplications(applicantId: string): Promise<JobApplication[]> {
    const q = query(collection(db, 'job_applications'), where('applicantId', '==', applicantId), orderBy('createdAt', 'desc'));
    const snap = await getDocs(q);
    const list: JobApplication[] = [];
    snap.forEach((d) => list.push({ id: d.id, ...d.data() } as JobApplication));
    return list;
  },

  // ===================== FREELANCE PROPOSALS =====================
  async submitProposal(data: Omit<FreelanceProposal, 'id' | 'createdAt' | 'status'>): Promise<string> {
    const colRef = collection(db, 'proposals');
    const docRef = await addDoc(colRef, {
      ...data,
      status: 'submitted',
      createdAt: new Date().toISOString(),
    });

    // increment project proposalsCount
    await updateDoc(doc(db, 'listings', data.projectId), {
      'projectDetails.proposalsCount': increment(1),
    }).catch(() => {});

    // Notify client
    await this.createNotification({
      userId: data.clientId,
      type: 'job_application',
      actorId: data.freelancerId,
      actorName: data.freelancerName,
      title: 'New Project Proposal',
      message: `${data.freelancerName} bid ৳${data.bidAmount} on "${data.projectTitle}".`,
      link: '/dashboard',
      read: false,
    });

    return docRef.id;
  },

  async getProposalsForProject(projectId: string): Promise<FreelanceProposal[]> {
    const q = query(collection(db, 'proposals'), where('projectId', '==', projectId), orderBy('createdAt', 'desc'));
    const snap = await getDocs(q);
    const list: FreelanceProposal[] = [];
    snap.forEach((d) => list.push({ id: d.id, ...d.data() } as FreelanceProposal));
    return list;
  },

  // ===================== "I NEED" / REQUESTS =====================
  async createRequest(data: Omit<RequestItem, 'id' | 'createdAt' | 'status' | 'responsesCount'>): Promise<string> {
    const colRef = collection(db, 'requests');
    const docRef = await addDoc(colRef, {
      ...data,
      status: 'open',
      responsesCount: 0,
      createdAt: new Date().toISOString(),
    });
    return docRef.id;
  },

  async getRequests(): Promise<RequestItem[]> {
    const q = query(collection(db, 'requests'), orderBy('createdAt', 'desc'), limit(50));
    const snap = await getDocs(q);
    const list: RequestItem[] = [];
    snap.forEach((d) => list.push({ id: d.id, ...d.data() } as RequestItem));
    return list;
  },

  async respondToRequest(data: Omit<RequestResponse, 'id' | 'createdAt'>, requesterUserId: string, requestTitle: string): Promise<string> {
    const colRef = collection(db, 'request_responses');
    const docRef = await addDoc(colRef, {
      ...data,
      createdAt: new Date().toISOString(),
    });

    await updateDoc(doc(db, 'requests', data.requestId), {
      responsesCount: increment(1),
      status: 'responses_received',
    }).catch(() => {});

    await this.createNotification({
      userId: requesterUserId,
      type: 'request_quote',
      actorId: data.providerId,
      actorName: data.providerName,
      title: 'Quote Received for Your Request',
      message: `${data.providerName} replied to "${requestTitle}": "${data.message.slice(0, 60)}"`,
      link: '/requests',
      read: false,
    });

    return docRef.id;
  },

  async getRequestResponses(requestId: string): Promise<RequestResponse[]> {
    const q = query(collection(db, 'request_responses'), where('requestId', '==', requestId), orderBy('createdAt', 'desc'));
    const snap = await getDocs(q);
    const list: RequestResponse[] = [];
    snap.forEach((d) => list.push({ id: d.id, ...d.data() } as RequestResponse));
    return list;
  },

  // ===================== COMMUNITIES & EVENTS =====================
  async createCommunity(data: Omit<Community, 'id' | 'createdAt' | 'membersCount'>): Promise<string> {
    const colRef = collection(db, 'communities');
    const docRef = await addDoc(colRef, {
      ...data,
      membersCount: 1,
      createdAt: new Date().toISOString(),
    });
    // add creator as member
    await setDoc(doc(db, 'community_members', `${data.creatorId}_${docRef.id}`), {
      userId: data.creatorId,
      communityId: docRef.id,
      joinedAt: new Date().toISOString(),
    });
    return docRef.id;
  },

  async getCommunities(): Promise<Community[]> {
    const q = query(collection(db, 'communities'), orderBy('membersCount', 'desc'), limit(40));
    const snap = await getDocs(q);
    const list: Community[] = [];
    snap.forEach((d) => list.push({ id: d.id, ...d.data() } as Community));
    return list;
  },

  async toggleJoinCommunity(userId: string, communityId: string): Promise<boolean> {
    const memberDocId = `${userId}_${communityId}`;
    const memberRef = doc(db, 'community_members', memberDocId);
    const snap = await getDoc(memberRef);
    const commRef = doc(db, 'communities', communityId);

    if (snap.exists()) {
      await deleteDoc(memberRef);
      await updateDoc(commRef, { membersCount: increment(-1) }).catch(() => {});
      return false; // left
    } else {
      await setDoc(memberRef, {
        userId,
        communityId,
        joinedAt: new Date().toISOString(),
      });
      await updateDoc(commRef, { membersCount: increment(1) }).catch(() => {});
      return true; // joined
    }
  },

  async isCommunityMember(userId: string, communityId: string): Promise<boolean> {
    const memberDocId = `${userId}_${communityId}`;
    const snap = await getDoc(doc(db, 'community_members', memberDocId));
    return snap.exists();
  },

  async createEvent(data: Omit<EventItem, 'id' | 'createdAt' | 'attendeesCount'>): Promise<string> {
    const colRef = collection(db, 'events');
    const docRef = await addDoc(colRef, {
      ...data,
      attendeesCount: 1,
      createdAt: new Date().toISOString(),
    });
    return docRef.id;
  },

  async getEvents(): Promise<EventItem[]> {
    const q = query(collection(db, 'events'), orderBy('date', 'asc'), limit(30));
    const snap = await getDocs(q);
    const list: EventItem[] = [];
    snap.forEach((d) => list.push({ id: d.id, ...d.data() } as EventItem));
    return list;
  },

  async rsvpEvent(userId: string, eventId: string): Promise<boolean> {
    const rsvpId = `${userId}_${eventId}`;
    const rsvpRef = doc(db, 'event_attendees', rsvpId);
    const snap = await getDoc(rsvpRef);
    const eventRef = doc(db, 'events', eventId);

    if (snap.exists()) {
      await deleteDoc(rsvpRef);
      await updateDoc(eventRef, { attendeesCount: increment(-1) }).catch(() => {});
      return false;
    } else {
      await setDoc(rsvpRef, {
        userId,
        eventId,
        createdAt: new Date().toISOString(),
      });
      await updateDoc(eventRef, { attendeesCount: increment(1) }).catch(() => {});
      return true;
    }
  },

  // ===================== REPORTS & VERIFICATIONS =====================
  async submitReport(data: Omit<Report, 'id' | 'createdAt' | 'status'>): Promise<string> {
    const colRef = collection(db, 'reports');
    const docRef = await addDoc(colRef, {
      ...data,
      status: 'pending',
      createdAt: new Date().toISOString(),
    });
    return docRef.id;
  },

  async getReports(): Promise<Report[]> {
    const q = query(collection(db, 'reports'), orderBy('createdAt', 'desc'), limit(50));
    const snap = await getDocs(q);
    const list: Report[] = [];
    snap.forEach((d) => list.push({ id: d.id, ...d.data() } as Report));
    return list;
  },

  async updateReportStatus(reportId: string, status: Report['status']): Promise<void> {
    await updateDoc(doc(db, 'reports', reportId), { status });
  },

  async submitVerificationRequest(data: Omit<VerificationRequest, 'id' | 'createdAt' | 'status'>): Promise<string> {
    const colRef = collection(db, 'verification_requests');
    const docRef = await addDoc(colRef, {
      ...data,
      status: 'pending',
      createdAt: new Date().toISOString(),
    });
    return docRef.id;
  },

  async getVerificationRequests(): Promise<VerificationRequest[]> {
    const q = query(collection(db, 'verification_requests'), orderBy('createdAt', 'desc'), limit(50));
    const snap = await getDocs(q);
    const list: VerificationRequest[] = [];
    snap.forEach((d) => list.push({ id: d.id, ...d.data() } as VerificationRequest));
    return list;
  },

  async updateVerificationStatus(requestId: string, status: 'approved' | 'rejected', targetUserId: string, type: VerificationRequest['type']): Promise<void> {
    await updateDoc(doc(db, 'verification_requests', requestId), { status });
    if (status === 'approved') {
      const userRef = doc(db, 'users', targetUserId);
      const fieldMap: Record<string, string> = {
        phone: 'verifications.phoneVerified',
        email: 'verifications.emailVerified',
        business: 'verifications.businessVerified',
        identity: 'verifications.identityVerified',
        professional: 'verifications.professionalVerified',
      };
      const field = fieldMap[type] || 'verifications.identityVerified';
      await updateDoc(userRef, { [field]: true });

      await this.createNotification({
        userId: targetUserId,
        type: 'verification',
        actorId: 'system',
        actorName: 'FindX Verification Board',
        title: 'Verification Approved',
        message: `Congratulations! Your ${type} verification request has been approved. The verified badge is now active on your profile.`,
        link: '/settings',
        read: false,
      });
    }
  },
};
