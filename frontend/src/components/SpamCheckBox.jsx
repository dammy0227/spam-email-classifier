import React from 'react';
import './SpamCheckBox.css';

const SpamCheckBox = ({ label, checked, onChange }) => {
  return (
    <div className="spam-checkbox">
      <input
        type="checkbox"
        id="spam-check"
        checked={checked}
        onChange={onChange}
      />
      <label htmlFor="spam-check">{label}</label>
    </div>
  );
};

export default SpamCheckBox;
