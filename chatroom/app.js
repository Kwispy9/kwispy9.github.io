const { useState, useEffect, useCallback } = React;

function App() {
  const [room, setRoom] = useState(null);
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [currentRoom, setCurrentRoom] = useState('public');
  const [isSending, setIsSending] = useState(false);
  const [sendStatus, setSendStatus] = useState('');
  
  // New state for tracking typing users and private chats
  const [typingUsers, setTypingUsers] = useState([]);
  const [peers, setPeers] = useState({});
  const [privateChatTarget, setPrivateChatTarget] = useState(null);

  // Typing timeout to prevent constant updates
  const TYPING_TIMER_LENGTH = 1000;
  let typingTimer = null;

  useEffect(() => {
    const websimRoom = new WebsimSocket();
    setRoom(websimRoom);

    // Update peers list immediately and on changes
    websimRoom.party.subscribe((updatedPeers) => {
      setPeers(updatedPeers);
    });

    websimRoom.onmessage = (event) => {
      const data = event.data;
      
      // Handle chat messages
      if (data.type === 'chat_message') {
        // Check if a private chat is being initiated with the current user
        const isPrivateMessageToMe = 
          data.privateChat && 
          data.privateChat.to === websimRoom.party.client.username;
        
        // Automatically switch to private chat if a message is sent to me
        if (isPrivateMessageToMe) {
          setCurrentRoom('private');
          setPrivateChatTarget(data.privateChat.from);
        }

        // Check if the message is for the current chat context
        const isPrivateMessage = data.privateChat !== undefined;
        const isRelevantMessage = 
          (currentRoom === 'public' && !isPrivateMessage) ||
          (isPrivateMessage && 
            ((data.privateChat.from === websimRoom.party.client.username && 
              data.privateChat.to === privateChatTarget) ||
             (data.privateChat.to === websimRoom.party.client.username && 
              data.privateChat.from === privateChatTarget)));

        if (isRelevantMessage && data.username !== websimRoom.party.client.username) {
          setMessages(prevMessages => [...prevMessages, {
            text: data.message,
            sender: data.username,
            type: 'user'
          }]);
        }
      }

      // Handle typing events (similar to previous implementation)
      if (data.type === 'user_typing') {
        setTypingUsers(prevUsers => {
          const updatedUsers = prevUsers.includes(data.username) 
            ? prevUsers 
            : [...prevUsers, data.username];
          return updatedUsers;
        });
      }

      if (data.type === 'user_stop_typing') {
        setTypingUsers(prevUsers => 
          prevUsers.filter(user => user !== data.username)
        );
      }
    };

    return () => {
      websimRoom.close();
    };
  }, [currentRoom, privateChatTarget]);

  // Reset messages when changing chat context
  useEffect(() => {
    setMessages([]);
  }, [currentRoom, privateChatTarget]);

  // Function to send typing notifications
  const sendTypingNotification = useCallback(() => {
    if (currentRoom === 'public' && room) {
      // Clear previous timer
      if (typingTimer) clearTimeout(typingTimer);
      
      // Send typing notification
      room.send({
        type: 'user_typing',
        username: room.party.client.username
      });

      // Set a timer to send stop typing after a delay
      typingTimer = setTimeout(() => {
        room.send({
          type: 'user_stop_typing',
          username: room.party.client.username
        });
      }, TYPING_TIMER_LENGTH);
    }
  }, [currentRoom, room]);

  // Updated startPrivateChat to send a notification
  const startPrivateChat = (username) => {
    // Send a chat message to initiate private chat
    room.send({
      type: 'chat_message',
      message: 'Started a private chat',
      username: room.party.client.username,
      privateChat: {
        from: room.party.client.username,
        to: username
      }
    });

    setCurrentRoom('private');
    setPrivateChatTarget(username);
  };

  // New function to close private chat
  const closePrivateChat = () => {
    // Send a notification that private chat is being closed
    room.send({
      type: 'chat_message',
      message: 'Private chat closed',
      username: room.party.client.username,
      privateChat: {
        from: room.party.client.username,
        to: privateChatTarget,
        status: 'closed'
      }
    });

    setCurrentRoom('public');
    setPrivateChatTarget(null);
  };

  // Updated sendMessage to support private chats
  const sendMessage = async () => {
    if (!inputMessage.trim()) return;

    if (currentRoom === 'ai') {
      // AI chat logic remains the same
      try {
        setIsSending(true);
        setSendStatus('Sending...');
        
        const aiResponse = await getAIResponse(inputMessage);
        
        setMessages(prevMessages => [
          ...prevMessages, 
          { text: inputMessage, sender: room.party.client.username, type: 'user' },
          { text: aiResponse, sender: 'AI ChatBot', type: 'ai' }
        ]);
        
        setSendStatus('Sent!');
        setTimeout(() => setSendStatus(''), 1000);
        setIsSending(false);
      } catch (error) {
        console.error('Error getting AI response:', error);
        setSendStatus('');
        setIsSending(false);
      }
    } else {
      // Public or Private chat
      const messagePayload = {
        type: 'chat_message',
        message: inputMessage,
        username: room.party.client.username
      };

      // Add private chat info if in private chat
      if (currentRoom === 'private' && privateChatTarget) {
        messagePayload.privateChat = {
          from: room.party.client.username,
          to: privateChatTarget
        };
      }

      // Send the message
      room.send(messagePayload);

      // Add message to local chat
      setMessages(prevMessages => [...prevMessages, {
        text: inputMessage,
        sender: room.party.client.username,
        type: 'user'
      }]);
    }

    setInputMessage('');
  };

  async function getAIResponse(userMessage) {
    try {
      const response = await fetch('/api/ai_completion', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({ 
          prompt: `You are a friendly, witty AI assistant in a chatroom. Provide a creative, engaging, and contextually relevant response to the user's message. Aim to be helpful, slightly humorous, and always interesting.

          Some guidelines:
          - If the message is a question, provide a clear and informative answer
          - If the message is a statement, offer an insightful or playful follow-up
          - Keep responses concise but engaging
          - Show personality and curiosity

          interface Response {
            reply: string;
          }
          `,
          data: userMessage
        }),
      });
      
      const data = await response.json();
      return data.reply || "Hmm, that's intriguing! I'm processing your message...";
    } catch (error) {
      console.error('Error fetching AI response:', error);
      return 'Oops! My circuits got a bit tangled. Could you repeat that?';
    }
  }

  // Render peers list for private chat
  const renderPeersList = () => {
    const currentUsername = room?.party.client.username;
    const peersList = Object.values(peers)
      .filter(peer => peer.username !== currentUsername);

    return (
      <div className="peers-list">
        <h3>Online Users</h3>
        {peersList.map(peer => (
          <div key={peer.username} className="peer-item">
            <span>{peer.username}</span>
            <button onClick={() => startPrivateChat(peer.username)}>
              Private Chat
            </button>
          </div>
        ))}
      </div>
    );
  };

  // Render typing status
  const renderTypingStatus = () => {
    if (currentRoom !== 'public' || typingUsers.length === 0) return null;

    if (typingUsers.length <= 3) {
      return (
        <div style={{ 
          textAlign: 'left', 
          color: 'gray', 
          marginLeft: '15px',
          marginBottom: '5px'
        }}>
          {typingUsers.map((user, index) => (
            <React.Fragment key={user}>
              <strong>{user}</strong>{index < typingUsers.length - 1 ? ', ' : ''}
            </React.Fragment>
          ))} {typingUsers.length === 1 ? 'is' : 'are'} typing...
        </div>
      );
    } else {
      const displayUsers = typingUsers.slice(0, 3);
      return (
        <div style={{ 
          textAlign: 'left', 
          color: 'gray', 
          marginLeft: '15px',
          marginBottom: '5px'
        }}>
          {displayUsers.map((user, index) => (
            <React.Fragment key={user}>
              <strong>{user}</strong>{index < displayUsers.length - 1 ? ', ' : ''}
            </React.Fragment>
          ))}, and {typingUsers.length - 3} other(s) are typing...
        </div>
      );
    }
  };

  return (
    <div className="chat-container">
      <div className="chat-header">
        <h1>Online Chatroom</h1>
      </div>
      
      <div className="chat-rooms">
        <button 
          onClick={() => {
            setCurrentRoom('public');
            setPrivateChatTarget(null);
          }}
          style={{backgroundColor: currentRoom === 'public' ? '#28a745' : '#007bff'}}
        >
          Public Chat
        </button>
        <button 
          onClick={() => {
            setCurrentRoom('ai');
            setPrivateChatTarget(null);
          }}
          style={{backgroundColor: currentRoom === 'ai' ? '#28a745' : '#007bff'}}
        >
          AI Chat
        </button>
        {currentRoom === 'private' && privateChatTarget && (
          <div style={{display: 'flex', alignItems: 'center'}}>
            <button 
              onClick={() => {
                setCurrentRoom('public');
                setPrivateChatTarget(null);
              }}
              style={{backgroundColor: '#28a745', marginRight: '10px'}}
            >
              Private Chat with {privateChatTarget}
            </button>
            <button 
              onClick={closePrivateChat}
              style={{backgroundColor: '#dc3545', color: 'white'}}
            >
              ✕ Close Chat
            </button>
          </div>
        )}
      </div>

      {/* Conditionally render peers list when not in AI or private chat */}
      {currentRoom === 'public' && renderPeersList()}

      <div className="messages">
        {messages.map((message, index) => (
          <div 
            key={index} 
            className={`message ${message.type}`}
            style={{
              alignSelf: message.type === 'user' ? 'flex-end' : 'flex-start',
              backgroundColor: message.type === 'user' ? '#e6f2ff' : '#f0f0f0'
            }}
          >
            <strong>{message.sender}: </strong>
            {message.text}
          </div>
        ))}
      </div>

      {/* Typing status for public chat */}
      {currentRoom === 'public' && renderTypingStatus()}

      {/* AI Chat sending status */}
      {currentRoom === 'ai' && (sendStatus || isSending) && (
        <div style={{ 
          textAlign: 'left', 
          color: 'gray', 
          marginLeft: '15px',
          marginBottom: '5px'
        }}>
          {sendStatus}
        </div>
      )}

      <div className="message-input">
        <input 
          type="text" 
          value={inputMessage}
          onChange={(e) => {
            setInputMessage(e.target.value);
            // Send typing notification when typing
            if (e.target.value.length > 0) {
              sendTypingNotification();
            }
          }}
          onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
          placeholder={`Send a message in ${currentRoom} chat`}
          disabled={isSending}
        />
        <button 
          onClick={sendMessage} 
          disabled={isSending}
        >
          Send
        </button>
      </div>
    </div>
  );
}

ReactDOM.render(<App />, document.getElementById('root'));