import PropTypes from "prop-types";
import React from "react";
import { Emoji } from "emoji-mart";
import ChannelHashTag from "./ChannelHashTag";

const getNameInitials = (name = "") => {
  let abbr = "";
  let str = name || "";
  str = str.split(" ");
  for (let i = 0; i < str.length; i++) {
    abbr += str[i].substr(0, 1);
  }
  if (abbr) {
    if (abbr[1]) {
      return abbr[0].toUpperCase() + abbr[1].toUpperCase();
    }
    return abbr[0].toUpperCase();
  }
};

const getHslFromString = (str, s, l) => {
  if(!s) {
    s = 50;
  }

  if(!l) {
    l = 50;
  }
  var hash = 0;
  for (var i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }

  var h = hash % 360;
  return 'hsl('+h+', '+s+'%, '+l+'%)';
}

const EntryComponent = ({
  mention,
  theme,
  searchValue, // eslint-disable-line no-unused-vars
  isFocused, // eslint-disable-line no-unused-vars
  ...parentProps
}) => {
  return (
    <div {...parentProps}>
      <div 
      className={theme.mentionSuggestionsEntryContainer}
      style={{
        padding: '5px',
        borderRadius: '4px',
      }}
      >
        <div
          data-role-id={`${mention.id}`}
          className={theme.mentionSuggestionsEntryContainerRight}
        >
          <div className={theme.mentionSuggestionsEntryText} 
          style={{
            display: 'flex',
            alignItems: 'center',
          }}
          >
            {
              mention.slug ?
              <>
              <div
              style={{
                display: 'flex',
                marginRight: '5px',
                alignItems: 'center',
                justifyContent: 'center',
              }}
              >
                {
                  mention.avatar ?
                    <span
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center', 
                      }}
                      dangerouslySetInnerHTML={{
                        //@ts-ignore
                        __html: Emoji({
                          html: true,
                          set: "apple",
                          emoji: mention.avatar,
                          size: 18
                        })
                      }}
                    />
                    :
                    <ChannelHashTag fill="#000" />
                }
              </div>
              </> :
              <>
              {mention.avatar ? (
                <img src={mention.avatar} alt="av" style={{
                  height: '35px',
                  width: '35px',
                  borderRadius: '50%',
                  marginRight: '6px',
                }}/>
              ) : (
                <div
                style={{
                  height: '35px',
                  width: '35px',
                  minWidth: '35px',
                  borderRadius: '50%',
                  marginRight: '6px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '13px',
                  color: '#fff',
                  fontWeight: '700',
                  fontFamily: 'Arial',
                  backgroundColor: getHslFromString(mention.name),
                }}
                >
                {getNameInitials(mention.name)}
                </div>
              )}
              </>
            }
            <span style={{
              fontSize: '14px',
              fontFamily: 'Arial',
              color: '#333',
              fontWeight: '400',
              lineHeight: '18px',
            }}>{mention.name}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

EntryComponent.propTypes = {
  mention: PropTypes.shape({
    name: PropTypes.string,
    mentionId: PropTypes.string
  }).isRequired,
  theme: PropTypes.shape({
    mentionSuggestionsEntryContainer: PropTypes.string,
    mentionSuggestionsEntryContainerRight: PropTypes.string,
    mentionSuggestionsEntryText: PropTypes.string
  }).isRequired,
  // eslint-disable-next-line react/require-default-props
  searchValue: PropTypes.string,
  isFocused: PropTypes.bool
};

export default EntryComponent;
