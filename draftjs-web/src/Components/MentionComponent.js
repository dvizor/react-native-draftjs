import PropTypes from "prop-types";
import React from "react";

const MentionComponent = ({ mention, children, className }) => (
  <span
    className={`${className} selected-mention`}
    spellCheck={false}
    data-role-id={mention.id}
    style={{
      cursor: 'default',
    }}
  >
    {children}
  </span>
);

MentionComponent.propTypes = {
  mention: PropTypes.shape({
    id: PropTypes.string
  }).isRequired,
  className: PropTypes.string
};

export default MentionComponent;
