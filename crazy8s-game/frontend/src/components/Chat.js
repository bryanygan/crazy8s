import React, { useState, useEffect } from 'react';
import { io } from 'socket.io-client';

const Chat = () => {
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState('');
    const socket = io('http://localhost:5000'); // Adjust the URL as needed

    useEffect(() => {
        socket.on('chat message', (message) => {
            setMessages((prevMessages) => [...prevMessages, message]);
        });

        return () => {
            socket.off('chat message');
        };
    }, [socket]);

    const sendMessage = (e) => {
        e.preventDefault();
        if (input) {
            socket.emit('chat message', input);
            setInput('');
        }
    };

    return (
        <div className="chat">
            <div className="messages">
                {messages.map((msg, index) => (
                    <div key={index}>{msg}</div>
                ))}
            </div>
            <form onSubmit={sendMessage}>
                <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="Type your message..."
                />
                <button type="submit">Send</button>
            </form>
        </div>
    );
};

export default Chat;