import React from 'react';
import DOMPurify from 'dompurify'; // npm install dompurify

const BotMessage = ({ text }) => {
  const formatMessage = (msg) => {
    // Headers (## Header)
    msg = msg.replace(/^##\s(.+)$/gm, '<h2 style="font-size: 1.25rem; font-weight: bold; margin: 0.5rem 0;">$1</h2>');
    
    // Bold (**bold**)
    msg = msg.replace(/\*\*(.+?)\*\*/g, '<strong style="font-weight: bold;">$1</strong>');
    
    // Italics (*italics*)
    msg = msg.replace(/\*(.+?)\*/g, '<em style="font-style: italic;">$1</em>');
    
    // Lists (- item)
    msg = msg.replace(/^-\s(.+)$/gm, '<li style="margin-left: 1.25rem; list-style-type: disc;">$1</li>');
    msg = msg.replace(/(<li>.*<\/li>)+/g, '<ul style="padding-left: 1rem; margin: 0.5rem 0;">$&</ul>');
    
    // Code blocks (`code`)
    msg = msg.replace(/`(.+?)`/g, '<code style="background: rgba(0,0,0,0.1); padding: 0.2rem 0.4rem; border-radius: 0.25rem;">$1</code>');
    
    // Links ([text](url))
    msg = msg.replace(/\[(.+?)\]\((.+?)\)/g, '<a href="$2" style="color: #2563eb; text-decoration: underline;" target="_blank" rel="noopener noreferrer">$1</a>');
    
    // Horizontal rule (---)
    msg = msg.replace(/^---$/gm, '<hr style="margin: 0.75rem 0; border: 0; border-top: 1px solid rgba(0,0,0,0.1);"/>');
    
    // Line breaks
    msg = msg.replace(/\n/g, '<br/>');
    
    return DOMPurify.sanitize(msg);
  };

  return (
    <div 
      className="bot-message"
      style={{
        maxWidth: 'none',
        color: 'inherit'
      }}
      dangerouslySetInnerHTML={{ __html: formatMessage(text) }}
    />
  );
};

export default BotMessage;