import { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { friendApi, messageApi, guildApi } from '@/lib/api';
import { X, Send } from 'lucide-react';
import { onNewMessage, onNewFriendRequest, onFriendRequestAccepted, emitSendMessage, emitFriendRequestSent, emitFriendRequestAccepted } from '@/lib/socket';
import { useGameStore } from '@/store/gameStore';
import dmIcon from '@/assets/ui/dm.png';
import addFriendIcon from '@/assets/ui/add_friend.png';
import removeFriendIcon from '@/assets/ui/remove_friend.png';
import guildInviteIcon from '@/assets/ui/guild_invite.png';
import friendsIcon from '@/assets/ui/friends.png';

export default function FriendsTab() {
  const queryClient = useQueryClient();
  const { setHasUnreadFriendMessages } = useGameStore();
  const [view, setView] = useState<'friends' | 'requests' | 'add'>('friends');
  const [selectedFriend, setSelectedFriend] = useState<any>(null);
  const [messageInput, setMessageInput] = useState('');
  const [addFriendUsername, setAddFriendUsername] = useState('');
  const [friendToRemove, setFriendToRemove] = useState<any>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Fetch friends
  const { data: friends, refetch: refetchFriends } = useQuery({
    queryKey: ['friends'],
    queryFn: async () => {
      const { data } = await friendApi.getFriends();
      return data;
    },
  });

  // Fetch friend requests
  const { data: friendRequests, refetch: refetchRequests } = useQuery({
    queryKey: ['friendRequests'],
    queryFn: async () => {
      const { data } = await friendApi.getRequests();
      return data;
    },
  });

  // Fetch conversation
  const { data: messages, refetch: refetchMessages } = useQuery({
    queryKey: ['conversation', selectedFriend?.id],
    queryFn: async () => {
      if (!selectedFriend) return [];
      const { data } = await messageApi.getConversation(selectedFriend.id);
      return data;
    },
    enabled: !!selectedFriend,
  });

  // Fetch unread count
  const { data: unreadCount } = useQuery({
    queryKey: ['unreadCount'],
    queryFn: async () => {
      const { data } = await messageApi.getUnreadCount();
      return data.count;
    },
    refetchInterval: 5000,
  });

  // Fetch player's guild
  const { data: myGuild } = useQuery({
    queryKey: ['myGuild'],
    queryFn: async () => {
      try {
        const { data } = await guildApi.getMyGuild();
        return data;
      } catch (error) {
        return null;
      }
    },
  });

  // Send friend request mutation
  const sendRequestMutation = useMutation({
    mutationFn: (username: string) => friendApi.sendRequest(username),
    onSuccess: (response) => {
      (window as any).showToast?.('Friend request sent!', 'success');
      setAddFriendUsername('');
      // Emit socket event
      emitFriendRequestSent(response.data.receiver.id, response.data);
    },
    onError: (error: any) => {
      (window as any).showToast?.(error.response?.data?.error || 'Failed to send request', 'error');
    },
  });

  // Accept friend request mutation
  const acceptRequestMutation = useMutation({
    mutationFn: (requestId: string) => friendApi.acceptRequest(requestId),
    onSuccess: (_, requestId) => {
      const request = friendRequests?.find((r: any) => r.id === requestId);
      if (request) {
        emitFriendRequestAccepted(request.senderId, { username: 'You' });
      }
      refetchRequests();
      refetchFriends();
      (window as any).showToast?.('Friend request accepted!', 'success');
    },
  });

  // Reject friend request mutation
  const rejectRequestMutation = useMutation({
    mutationFn: (requestId: string) => friendApi.rejectRequest(requestId),
    onSuccess: () => {
      refetchRequests();
      (window as any).showToast?.('Friend request rejected', 'info');
    },
  });

  // Remove friend mutation
  const removeFriendMutation = useMutation({
    mutationFn: (friendId: string) => friendApi.removeFriend(friendId),
    onSuccess: () => {
      setSelectedFriend(null);
      setFriendToRemove(null);
      refetchFriends();
      (window as any).showToast?.('Friend removed', 'info');
    },
  });

  // Guild invite mutation
  const inviteToGuildMutation = useMutation({
    mutationFn: (playerId: string) => guildApi.invitePlayer(playerId),
    onSuccess: () => {
      (window as any).showToast?.('Guild invitation sent!', 'success');
    },
    onError: (error: any) => {
      (window as any).showToast?.(error.response?.data?.error || 'Failed to send guild invite', 'error');
    },
  });

  // Send message mutation
  const sendMessageMutation = useMutation({
    mutationFn: ({ receiverId, content }: { receiverId: string; content: string }) =>
      messageApi.send(receiverId, content),
    onSuccess: (response) => {
      setMessageInput('');
      refetchMessages();
      // Emit socket event
      emitSendMessage(selectedFriend.id, response.data);
    },
  });

  // Socket listeners
  useEffect(() => {
    const handleNewMessage = (data: any) => {
      if (selectedFriend && data.senderId === selectedFriend.id) {
        refetchMessages();
      }
      // Mark as having unread messages
      setHasUnreadFriendMessages(true);
      queryClient.invalidateQueries({ queryKey: ['unreadCount'] });
      queryClient.invalidateQueries({ queryKey: ['unreadFriendMessages'] });
    };

    const handleNewRequest = () => {
      refetchRequests();
    };

    const handleRequestAccepted = () => {
      refetchFriends();
    };

    onNewMessage(handleNewMessage);
    onNewFriendRequest(handleNewRequest);
    onFriendRequestAccepted(handleRequestAccepted);
  }, [selectedFriend, queryClient]);

  // Clear unread flag when tab opens
  useEffect(() => {
    setHasUnreadFriendMessages(false);
  }, [setHasUnreadFriendMessages]);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  const handleSendMessage = () => {
    if (!messageInput.trim() || !selectedFriend) return;
    sendMessageMutation.mutate({
      receiverId: selectedFriend.id,
      content: messageInput,
    });
  };

  return (
    <div className="p-4 pb-20">
      {/* Header */}
      <div className="mb-4 flex items-center gap-2">
        <img
          src={friendsIcon}
          alt="Friends"
          className="w-6 h-6"
          style={{ imageRendering: 'pixelated' }}
        />
        <h2
          className="text-2xl font-bold text-white"
          style={{
            fontFamily: 'monospace',
            textShadow: '2px 2px 0 #000',
            letterSpacing: '1px',
          }}
        >
          FRIENDS & MESSAGES
        </h2>
        {unreadCount > 0 && (
          <span
            className="bg-red-600 text-white text-xs px-2 py-1 font-bold"
            style={{
              fontFamily: 'monospace',
              border: '2px solid #991b1b',
              boxShadow: '0 2px 0 #7f1d1d',
            }}
          >
            {unreadCount}
          </span>
        )}
      </div>

      {/* Tab Switcher - Retro Style */}
      <div className="grid grid-cols-3 gap-2 mb-4">
        <button
          onClick={() => setView('friends')}
          className={`py-2 text-xs font-bold transition relative overflow-hidden ${
            view === 'friends'
              ? 'bg-blue-700 text-white'
              : 'bg-stone-800 text-gray-400 hover:bg-stone-700'
          }`}
          style={{
            border: view === 'friends' ? '2px solid #1e3a8a' : '2px solid #57534e',
            borderRadius: '0',
            boxShadow: view === 'friends' ? '0 2px 0 #1e40af, inset 0 1px 0 rgba(255,255,255,0.2)' : 'none',
            textShadow: view === 'friends' ? '1px 1px 0 #000' : 'none',
            fontFamily: 'monospace',
          }}
        >
          FRIENDS ({friends?.length || 0})
        </button>
        <button
          onClick={() => setView('requests')}
          className={`py-2 text-xs font-bold transition relative overflow-hidden ${
            view === 'requests'
              ? 'bg-amber-700 text-white'
              : 'bg-stone-800 text-gray-400 hover:bg-stone-700'
          }`}
          style={{
            border: view === 'requests' ? '2px solid #92400e' : '2px solid #57534e',
            borderRadius: '0',
            boxShadow: view === 'requests' ? '0 2px 0 #b45309, inset 0 1px 0 rgba(255,255,255,0.2)' : 'none',
            textShadow: view === 'requests' ? '1px 1px 0 #000' : 'none',
            fontFamily: 'monospace',
          }}
        >
          REQUESTS
          {friendRequests && friendRequests.length > 0 && (
            <span
              className="absolute -top-1 -right-1 bg-red-600 text-white text-xs w-5 h-5 flex items-center justify-center font-bold"
              style={{ border: '2px solid #991b1b' }}
            >
              {friendRequests.length}
            </span>
          )}
        </button>
        <button
          onClick={() => setView('add')}
          className={`py-2 text-xs font-bold transition relative overflow-hidden ${
            view === 'add'
              ? 'bg-green-700 text-white'
              : 'bg-stone-800 text-gray-400 hover:bg-stone-700'
          }`}
          style={{
            border: view === 'add' ? '2px solid #15803d' : '2px solid #57534e',
            borderRadius: '0',
            boxShadow: view === 'add' ? '0 2px 0 #166534, inset 0 1px 0 rgba(255,255,255,0.2)' : 'none',
            textShadow: view === 'add' ? '1px 1px 0 #000' : 'none',
            fontFamily: 'monospace',
          }}
        >
          ADD FRIEND
        </button>
      </div>

      {/* Friends List */}
      {view === 'friends' && (
        <div className="space-y-2">
          {!friends || friends.length === 0 ? (
            <div
              className="text-center py-12 bg-stone-800"
              style={{
                border: '4px solid #57534e',
                boxShadow: '0 4px 0 #292524, inset 0 2px 0 rgba(255,255,255,0.1)',
              }}
            >
              <img
                src={friendsIcon}
                alt="No friends"
                className="w-16 h-16 mx-auto mb-3 opacity-50"
                style={{ imageRendering: 'pixelated' }}
              />
              <p className="text-gray-400" style={{ fontFamily: 'monospace' }}>
                No friends yet. Add some friends to get started!
              </p>
            </div>
          ) : (
            friends.map((friend: any) => (
              <div
                key={friend.id}
                className="bg-stone-800 p-3"
                style={{
                  border: '3px solid #57534e',
                  boxShadow: '0 2px 0 #292524',
                }}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex-1">
                    <p
                      className="font-bold text-white text-sm"
                      style={{ fontFamily: 'monospace' }}
                    >
                      {friend.username}
                    </p>
                    {friend.character && (
                      <p className="text-xs text-gray-400" style={{ fontFamily: 'monospace' }}>
                        {friend.character.name} • Lv.{friend.character.level} {friend.character.class}
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setSelectedFriend(friend)}
                    className="flex-1 py-2 bg-blue-700 hover:bg-blue-600 text-white text-xs font-bold transition flex items-center justify-center gap-1"
                    style={{
                      border: '2px solid #1e3a8a',
                      boxShadow: '0 2px 0 #1e40af',
                      fontFamily: 'monospace',
                    }}
                  >
                    <img
                      src={dmIcon}
                      alt="Message"
                      className="w-4 h-4"
                      style={{ imageRendering: 'pixelated' }}
                    />
                    MESSAGE
                  </button>
                  {myGuild && myGuild.members.some((m: any) => m.rank === 'Leader' || m.rank === 'Officer') && !friend.guildId && (
                    <button
                      onClick={() => inviteToGuildMutation.mutate(friend.id)}
                      disabled={inviteToGuildMutation.isPending}
                      className="px-3 py-2 bg-purple-700 hover:bg-purple-600 text-white text-xs font-bold transition disabled:opacity-50"
                      style={{
                        border: '2px solid #6b21a8',
                        boxShadow: '0 2px 0 #7e22ce',
                        fontFamily: 'monospace',
                      }}
                      title="Invite to Guild"
                    >
                      <img
                        src={guildInviteIcon}
                        alt="Guild Invite"
                        className="w-4 h-4"
                        style={{ imageRendering: 'pixelated' }}
                      />
                    </button>
                  )}
                  <button
                    onClick={() => setFriendToRemove(friend)}
                    disabled={removeFriendMutation.isPending}
                    className="px-3 py-2 bg-red-700 hover:bg-red-600 text-white text-xs font-bold transition disabled:opacity-50"
                    style={{
                      border: '2px solid #991b1b',
                      boxShadow: '0 2px 0 #7f1d1d',
                      fontFamily: 'monospace',
                    }}
                    title="Remove Friend"
                  >
                    <img
                      src={removeFriendIcon}
                      alt="Remove"
                      className="w-4 h-4"
                      style={{ imageRendering: 'pixelated' }}
                    />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Friend Requests */}
      {view === 'requests' && (
        <div className="space-y-2">
          {!friendRequests || friendRequests.length === 0 ? (
            <div
              className="text-center py-12 bg-stone-800"
              style={{
                border: '4px solid #57534e',
                boxShadow: '0 4px 0 #292524, inset 0 2px 0 rgba(255,255,255,0.1)',
              }}
            >
              <img
                src={addFriendIcon}
                alt="No requests"
                className="w-16 h-16 mx-auto mb-3 opacity-50"
                style={{ imageRendering: 'pixelated' }}
              />
              <p className="text-gray-400" style={{ fontFamily: 'monospace' }}>
                No pending friend requests
              </p>
            </div>
          ) : (
            friendRequests.map((request: any) => (
              <div
                key={request.id}
                className="p-3 bg-stone-800"
                style={{
                  border: '3px solid #92400e',
                  boxShadow: '0 2px 0 #b45309',
                }}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex-1">
                    <p className="font-bold text-white text-sm" style={{ fontFamily: 'monospace' }}>
                      {request.sender.username}
                    </p>
                    {request.sender.character && (
                      <p className="text-xs text-gray-400" style={{ fontFamily: 'monospace' }}>
                        {request.sender.character.name} • Lv.{request.sender.character.level} {request.sender.character.class}
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => acceptRequestMutation.mutate(request.id)}
                    disabled={acceptRequestMutation.isPending}
                    className="flex-1 py-2 bg-green-700 hover:bg-green-600 text-white text-xs font-bold transition disabled:opacity-50 flex items-center justify-center gap-1"
                    style={{
                      border: '2px solid #15803d',
                      boxShadow: '0 2px 0 #166534',
                      fontFamily: 'monospace',
                    }}
                  >
                    <img
                      src={addFriendIcon}
                      alt="Accept"
                      className="w-4 h-4"
                      style={{ imageRendering: 'pixelated' }}
                    />
                    ACCEPT
                  </button>
                  <button
                    onClick={() => rejectRequestMutation.mutate(request.id)}
                    disabled={rejectRequestMutation.isPending}
                    className="px-3 py-2 bg-red-700 hover:bg-red-600 text-white text-xs font-bold transition disabled:opacity-50"
                    style={{
                      border: '2px solid #991b1b',
                      boxShadow: '0 2px 0 #7f1d1d',
                      fontFamily: 'monospace',
                    }}
                  >
                    <img
                      src={removeFriendIcon}
                      alt="Reject"
                      className="w-4 h-4"
                      style={{ imageRendering: 'pixelated' }}
                    />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Add Friend */}
      {view === 'add' && (
        <div
          className="bg-stone-800 p-4"
          style={{
            border: '4px solid #57534e',
            boxShadow: '0 4px 0 #292524, inset 0 2px 0 rgba(255,255,255,0.1)',
          }}
        >
          <h3
            className="font-bold text-amber-400 mb-4 text-lg"
            style={{
              fontFamily: 'monospace',
              textShadow: '2px 2px 0 #000',
              letterSpacing: '1px',
            }}
          >
            ADD FRIEND BY CHARACTER NAME
          </h3>
          <div className="flex gap-2">
            <input
              type="text"
              value={addFriendUsername}
              onChange={(e) => setAddFriendUsername(e.target.value)}
              placeholder="Enter character name..."
              className="flex-1 px-3 py-2 bg-stone-900 border-2 border-stone-700 text-white focus:border-green-500 outline-none"
              style={{ fontFamily: 'monospace' }}
              onKeyPress={(e) => {
                if (e.key === 'Enter' && addFriendUsername.trim()) {
                  sendRequestMutation.mutate(addFriendUsername);
                }
              }}
            />
            <button
              onClick={() => sendRequestMutation.mutate(addFriendUsername)}
              disabled={!addFriendUsername.trim() || sendRequestMutation.isPending}
              className="px-4 py-2 bg-green-700 hover:bg-green-600 disabled:bg-gray-700 disabled:cursor-not-allowed text-white font-bold transition text-xs flex items-center gap-1"
              style={{
                border: '2px solid #15803d',
                boxShadow: '0 2px 0 #166534',
                fontFamily: 'monospace',
              }}
            >
              <img
                src={addFriendIcon}
                alt="Send"
                className="w-4 h-4"
                style={{ imageRendering: 'pixelated' }}
              />
              SEND REQUEST
            </button>
          </div>
        </div>
      )}

      {/* Chat Window */}
      {selectedFriend && (
        <div className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50 p-4">
          <div
            className="bg-stone-900 w-full max-w-2xl max-h-[80vh] flex flex-col"
            style={{
              border: '4px solid #57534e',
              boxShadow: '0 8px 0 rgba(0,0,0,0.5)',
            }}
          >
            {/* Chat Header */}
            <div
              className="p-4 bg-gradient-to-b from-stone-700 to-stone-800 flex items-center justify-between"
              style={{
                borderBottom: '4px solid #292524',
              }}
            >
              <div className="flex items-center gap-2">
                <img
                  src={dmIcon}
                  alt="DM"
                  className="w-6 h-6"
                  style={{ imageRendering: 'pixelated' }}
                />
                <div>
                  <h3
                    className="font-bold text-white text-lg"
                    style={{
                      fontFamily: 'monospace',
                      textShadow: '1px 1px 0 #000',
                    }}
                  >
                    {selectedFriend.username}
                  </h3>
                  {selectedFriend.character && (
                    <p className="text-xs text-gray-400" style={{ fontFamily: 'monospace' }}>
                      {selectedFriend.character.name} • {selectedFriend.character.class}
                    </p>
                  )}
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setFriendToRemove(selectedFriend)}
                  disabled={removeFriendMutation.isPending}
                  className="px-3 py-2 bg-red-700 hover:bg-red-600 text-white text-xs font-bold transition disabled:opacity-50 flex items-center gap-1"
                  style={{
                    border: '2px solid #991b1b',
                    boxShadow: '0 2px 0 #7f1d1d',
                    fontFamily: 'monospace',
                  }}
                >
                  <img
                    src={removeFriendIcon}
                    alt="Remove"
                    className="w-4 h-4"
                    style={{ imageRendering: 'pixelated' }}
                  />
                  REMOVE
                </button>
                <button
                  onClick={() => setSelectedFriend(null)}
                  className="px-3 py-2 bg-stone-700 hover:bg-stone-600 text-white text-xs font-bold transition"
                  style={{
                    border: '2px solid #57534e',
                    boxShadow: '0 2px 0 #292524',
                    fontFamily: 'monospace',
                  }}
                >
                  <X size={16} />
                </button>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-stone-900">
              {!messages || messages.length === 0 ? (
                <div className="text-center py-12">
                  <img
                    src={dmIcon}
                    alt="No messages"
                    className="w-16 h-16 mx-auto mb-3 opacity-50"
                    style={{ imageRendering: 'pixelated' }}
                  />
                  <p className="text-gray-400" style={{ fontFamily: 'monospace' }}>
                    No messages yet. Start the conversation!
                  </p>
                </div>
              ) : (
                <>
                  {messages.map((msg: any) => (
                    <div
                      key={msg.id}
                      className={`flex ${msg.senderId === selectedFriend.id ? 'justify-start' : 'justify-end'}`}
                    >
                      <div
                        className={`max-w-[70%] p-3 ${
                          msg.senderId === selectedFriend.id
                            ? 'bg-stone-800 text-white'
                            : 'bg-blue-700 text-white'
                        }`}
                        style={{
                          border: msg.senderId === selectedFriend.id ? '2px solid #57534e' : '2px solid #1e3a8a',
                          boxShadow: msg.senderId === selectedFriend.id ? '0 2px 0 #292524' : '0 2px 0 #1e40af',
                        }}
                      >
                        <p className="text-sm" style={{ fontFamily: 'monospace' }}>
                          {msg.content}
                        </p>
                        <p className="text-xs opacity-60 mt-1" style={{ fontFamily: 'monospace' }}>
                          {new Date(msg.createdAt).toLocaleTimeString()}
                        </p>
                      </div>
                    </div>
                  ))}
                  <div ref={messagesEndRef} />
                </>
              )}
            </div>

            {/* Message Input */}
            <div
              className="p-4 bg-stone-800"
              style={{
                borderTop: '4px solid #292524',
              }}
            >
              <div className="flex gap-2 mb-2">
                <input
                  type="text"
                  value={messageInput}
                  onChange={(e) => setMessageInput(e.target.value)}
                  placeholder="Type a message..."
                  className="flex-1 px-3 py-2 bg-stone-900 border-2 border-stone-700 text-white focus:border-blue-500 outline-none"
                  style={{ fontFamily: 'monospace' }}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter' && messageInput.trim()) {
                      handleSendMessage();
                    }
                  }}
                  maxLength={500}
                />
                <button
                  onClick={handleSendMessage}
                  disabled={!messageInput.trim() || sendMessageMutation.isPending}
                  className="px-4 py-2 bg-blue-700 hover:bg-blue-600 disabled:bg-gray-700 disabled:cursor-not-allowed text-white font-bold transition flex items-center gap-1"
                  style={{
                    border: '2px solid #1e3a8a',
                    boxShadow: '0 2px 0 #1e40af',
                    fontFamily: 'monospace',
                  }}
                >
                  <Send size={14} />
                  SEND
                </button>
              </div>
              <p
                className="text-xs text-gray-400"
                style={{ fontFamily: 'monospace' }}
              >
                {messageInput.length}/500 characters
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Remove Friend Confirmation Modal */}
      {friendToRemove && (
        <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-[200] p-4">
          <div
            className="bg-stone-800 p-6 max-w-md w-full"
            style={{
              border: '4px solid #991b1b',
              boxShadow: '0 8px 0 rgba(0,0,0,0.5)',
            }}
          >
            <h3
              className="text-xl font-bold text-red-400 mb-4"
              style={{
                fontFamily: 'monospace',
                textShadow: '2px 2px 0 #000',
              }}
            >
              REMOVE FRIEND?
            </h3>
            <p
              className="text-white mb-6"
              style={{ fontFamily: 'monospace' }}
            >
              Are you sure you want to remove <span className="text-amber-400 font-bold">{friendToRemove.username}</span> from your friends?
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => {
                  removeFriendMutation.mutate(friendToRemove.id);
                }}
                disabled={removeFriendMutation.isPending}
                className="flex-1 py-3 bg-red-700 hover:bg-red-600 text-white font-bold transition disabled:opacity-50"
                style={{
                  border: '2px solid #991b1b',
                  boxShadow: '0 4px 0 #7f1d1d',
                  fontFamily: 'monospace',
                }}
              >
                YES, REMOVE
              </button>
              <button
                onClick={() => setFriendToRemove(null)}
                className="flex-1 py-3 bg-stone-700 hover:bg-stone-600 text-white font-bold transition"
                style={{
                  border: '2px solid #57534e',
                  boxShadow: '0 4px 0 #292524',
                  fontFamily: 'monospace',
                }}
              >
                CANCEL
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
