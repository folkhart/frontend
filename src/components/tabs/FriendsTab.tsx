import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { friendApi, messageApi } from '@/lib/api';
import { Users, UserPlus, X, Check, MessageCircle, Send, Trash2 } from 'lucide-react';
import { onNewMessage, onNewFriendRequest, onFriendRequestAccepted, emitSendMessage, emitFriendRequestSent, emitFriendRequestAccepted } from '@/lib/socket';

export default function FriendsTab() {
  const queryClient = useQueryClient();
  const [view, setView] = useState<'friends' | 'requests' | 'add'>('friends');
  const [selectedFriend, setSelectedFriend] = useState<any>(null);
  const [messageInput, setMessageInput] = useState('');
  const [addFriendUsername, setAddFriendUsername] = useState('');

  // Fetch friends
  const { data: friends, refetch: refetchFriends } = useQuery({
    queryKey: ['friends'],
    queryFn: async () => {
      try {
        const { data } = await friendApi.getFriends();
        return data;
      } catch (error) {
        console.error('Friends API not available yet');
        return [];
      }
    },
  });

  // Fetch friend requests
  const { data: friendRequests, refetch: refetchRequests } = useQuery({
    queryKey: ['friendRequests'],
    queryFn: async () => {
      try {
        const { data } = await friendApi.getRequests();
        return data;
      } catch (error) {
        console.error('Friend requests API not available yet');
        return [];
      }
    },
  });

  // Fetch conversation
  const { data: messages, refetch: refetchMessages } = useQuery({
    queryKey: ['conversation', selectedFriend?.id],
    queryFn: async () => {
      if (!selectedFriend) return [];
      try {
        const { data } = await messageApi.getConversation(selectedFriend.id);
        return data;
      } catch (error) {
        console.error('Messages API not available yet');
        return [];
      }
    },
    enabled: !!selectedFriend,
  });

  // Fetch unread count
  const { data: unreadCount } = useQuery({
    queryKey: ['unreadCount'],
    queryFn: async () => {
      try {
        const { data } = await messageApi.getUnreadCount();
        return data.count;
      } catch (error) {
        console.error('Unread count API not available yet');
        return 0;
      }
    },
    refetchInterval: 5000,
    retry: false,
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
      refetchFriends();
      (window as any).showToast?.('Friend removed', 'info');
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
      queryClient.invalidateQueries({ queryKey: ['unreadCount'] });
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

    return () => {
      // Cleanup listeners if needed
    };
  }, [selectedFriend]);

  const handleSendMessage = () => {
    if (!messageInput.trim() || !selectedFriend) return;
    sendMessageMutation.mutate({
      receiverId: selectedFriend.id,
      content: messageInput,
    });
  };

  return (
    <div className="p-3 pb-20">
      <h2 className="text-lg font-bold text-white mb-3 flex items-center gap-2">
        <Users size={20} className="text-blue-400" />
        Friends
        {unreadCount > 0 && (
          <span className="bg-red-500 text-white text-xs px-2 py-0.5 rounded-full">
            {unreadCount}
          </span>
        )}
      </h2>

      {/* Backend Deployment Notice */}
      <div className="bg-blue-900 border-2 border-blue-600 p-4 mb-4 rounded">
        <p className="text-blue-200 text-sm font-bold mb-1">🚀 Feature Deploying...</p>
        <p className="text-blue-300 text-xs">
          The Friends & Messaging system is being deployed to the server. 
          Please check back in a few minutes!
        </p>
      </div>

      {/* Tab Switcher */}
      <div className="flex gap-2 mb-4">
        <button
          onClick={() => setView('friends')}
          className={`flex-1 py-2 px-3 font-bold text-sm transition ${
            view === 'friends'
              ? 'bg-blue-700 text-white'
              : 'bg-stone-800 text-gray-400 hover:bg-stone-700'
          }`}
          style={{ border: '2px solid #1e3a8a', borderRadius: '0' }}
        >
          <Users size={14} className="inline mr-1" />
          Friends ({friends?.length || 0})
        </button>
        <button
          onClick={() => setView('requests')}
          className={`flex-1 py-2 px-3 font-bold text-sm transition relative ${
            view === 'requests'
              ? 'bg-amber-700 text-white'
              : 'bg-stone-800 text-gray-400 hover:bg-stone-700'
          }`}
          style={{ border: '2px solid #92400e', borderRadius: '0' }}
        >
          <Check size={14} className="inline mr-1" />
          Requests
          {friendRequests && friendRequests.length > 0 && (
            <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center">
              {friendRequests.length}
            </span>
          )}
        </button>
        <button
          onClick={() => setView('add')}
          className={`flex-1 py-2 px-3 font-bold text-sm transition ${
            view === 'add'
              ? 'bg-green-700 text-white'
              : 'bg-stone-800 text-gray-400 hover:bg-stone-700'
          }`}
          style={{ border: '2px solid #15803d', borderRadius: '0' }}
        >
          <UserPlus size={14} className="inline mr-1" />
          Add
        </button>
      </div>

      {/* Friends List */}
      {view === 'friends' && (
        <div className="space-y-2">
          {!friends || friends.length === 0 ? (
            <div className="text-center py-8 text-gray-400">
              <Users size={48} className="mx-auto mb-2 opacity-50" />
              <p>No friends yet. Add some friends to get started!</p>
            </div>
          ) : (
            friends.map((friend: any) => (
              <div
                key={friend.id}
                onClick={() => setSelectedFriend(friend)}
                className={`p-3 bg-stone-800 border-2 cursor-pointer transition ${
                  selectedFriend?.id === friend.id
                    ? 'border-blue-500 bg-stone-700'
                    : 'border-stone-700 hover:border-stone-600'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <p className="font-bold text-white">{friend.username}</p>
                    {friend.character && (
                      <p className="text-xs text-gray-400">
                        {friend.character.name} • Lv.{friend.character.level} {friend.character.class}
                      </p>
                    )}
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedFriend(friend);
                    }}
                    className="p-2 bg-blue-600 hover:bg-blue-500 text-white rounded"
                  >
                    <MessageCircle size={16} />
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
            <div className="text-center py-8 text-gray-400">
              <Check size={48} className="mx-auto mb-2 opacity-50" />
              <p>No pending friend requests</p>
            </div>
          ) : (
            friendRequests.map((request: any) => (
              <div
                key={request.id}
                className="p-3 bg-stone-800 border-2 border-amber-600"
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <p className="font-bold text-white">{request.sender.username}</p>
                    {request.sender.character && (
                      <p className="text-xs text-gray-400">
                        {request.sender.character.name} • Lv.{request.sender.character.level} {request.sender.character.class}
                      </p>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => acceptRequestMutation.mutate(request.id)}
                      className="p-2 bg-green-600 hover:bg-green-500 text-white rounded"
                    >
                      <Check size={16} />
                    </button>
                    <button
                      onClick={() => rejectRequestMutation.mutate(request.id)}
                      className="p-2 bg-red-600 hover:bg-red-500 text-white rounded"
                    >
                      <X size={16} />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Add Friend */}
      {view === 'add' && (
        <div className="bg-stone-800 border-2 border-stone-700 p-4">
          <h3 className="font-bold text-white mb-3">Add Friend by Username</h3>
          <div className="flex gap-2">
            <input
              type="text"
              value={addFriendUsername}
              onChange={(e) => setAddFriendUsername(e.target.value)}
              placeholder="Enter username..."
              className="flex-1 px-3 py-2 bg-stone-900 border-2 border-stone-700 text-white focus:border-blue-500 outline-none"
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  sendRequestMutation.mutate(addFriendUsername);
                }
              }}
            />
            <button
              onClick={() => sendRequestMutation.mutate(addFriendUsername)}
              disabled={!addFriendUsername.trim() || sendRequestMutation.isPending}
              className="px-4 py-2 bg-green-600 hover:bg-green-500 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-bold transition"
            >
              <UserPlus size={16} className="inline mr-1" />
              Send
            </button>
          </div>
        </div>
      )}

      {/* Chat Window */}
      {selectedFriend && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
          <div className="bg-stone-900 border-4 border-stone-700 w-full max-w-2xl max-h-[80vh] flex flex-col">
            {/* Chat Header */}
            <div className="p-4 bg-stone-800 border-b-2 border-stone-700 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-white">{selectedFriend.username}</h3>
                {selectedFriend.character && (
                  <p className="text-xs text-gray-400">
                    {selectedFriend.character.name} • {selectedFriend.character.class}
                  </p>
                )}
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    if (confirm(`Remove ${selectedFriend.username} from friends?`)) {
                      removeFriendMutation.mutate(selectedFriend.id);
                    }
                  }}
                  className="p-2 bg-red-600 hover:bg-red-500 text-white rounded"
                >
                  <Trash2 size={16} />
                </button>
                <button
                  onClick={() => setSelectedFriend(null)}
                  className="p-2 bg-stone-700 hover:bg-stone-600 text-white rounded"
                >
                  <X size={20} />
                </button>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-2">
              {!messages || messages.length === 0 ? (
                <div className="text-center py-8 text-gray-400">
                  <MessageCircle size={48} className="mx-auto mb-2 opacity-50" />
                  <p>No messages yet. Start the conversation!</p>
                </div>
              ) : (
                messages.map((msg: any) => (
                  <div
                    key={msg.id}
                    className={`flex ${msg.senderId === selectedFriend.id ? 'justify-start' : 'justify-end'}`}
                  >
                    <div
                      className={`max-w-[70%] p-3 rounded ${
                        msg.senderId === selectedFriend.id
                          ? 'bg-stone-700 text-white'
                          : 'bg-blue-600 text-white'
                      }`}
                    >
                      <p className="text-sm">{msg.content}</p>
                      <p className="text-xs opacity-60 mt-1">
                        {new Date(msg.createdAt).toLocaleTimeString()}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Message Input */}
            <div className="p-4 bg-stone-800 border-t-2 border-stone-700">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={messageInput}
                  onChange={(e) => setMessageInput(e.target.value)}
                  placeholder="Type a message..."
                  className="flex-1 px-3 py-2 bg-stone-900 border-2 border-stone-700 text-white focus:border-blue-500 outline-none"
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      handleSendMessage();
                    }
                  }}
                  maxLength={500}
                />
                <button
                  onClick={handleSendMessage}
                  disabled={!messageInput.trim() || sendMessageMutation.isPending}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-500 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-bold transition"
                >
                  <Send size={16} />
                </button>
              </div>
              <p className="text-xs text-gray-400 mt-1">
                {messageInput.length}/500 characters
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
