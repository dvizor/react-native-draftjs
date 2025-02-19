import React, { useState, createRef, useEffect, useCallback, useRef } from "react";
import {
  EditorState,
  RichUtils,
  getDefaultKeyBinding,
  DefaultDraftBlockRenderMap,
  convertToRaw,
  convertFromRaw,
} from "draft-js";
import { stateToHTML } from "draft-js-export-html";
import { Map } from "immutable";
import EditorController from "./Components/EditorController/EditorController";
import Editor from '@draft-js-plugins/editor';
import createMentionPlugin from '@draft-js-plugins/mention';
import '@draft-js-plugins/mention/lib/plugin.css';
import MentionComponent from './Components/MentionComponent';
import EntryComponent from './Components/EntryComponent';
import 'draft-js/dist/Draft.css';
import axios from 'axios';
import './App.css';

 //mentions plugin
 const mentionPlugin = createMentionPlugin({
  entityMutability: 'IMMUTABLE',
  //@ts-ignore
  mentionComponent: MentionComponent,
  theme: {
    mention: 'postable-draft-mention-text',
    mentionSuggestions: 'postable-draft-mention-suggestions-container',
  },
  mentionPrefix: '@',
  supportWhitespace: true,
});

// channel mentions plugin
const channelMentionPlugin = createMentionPlugin({
  entityMutability: 'IMMUTABLE',
  //@ts-ignore
  mentionComponent: MentionComponent,
  theme: {
    mention: 'postable-draft-mention-channel',
    mentionSuggestions: 'postable-draft-mention-suggestions-container',
  },
  mentionPrefix: '#',
  mentionTrigger: '#',
  supportWhitespace: true,
});

const { MentionSuggestions: UserMentionSuggestions } = mentionPlugin;
const { MentionSuggestions: ChannelMentionSuggestions } = channelMentionPlugin;

const plugins = [mentionPlugin, channelMentionPlugin];

/**
 * For testing the post messages
 * in web
 */
// window.ReactNativeWebView ={};
// window.ReactNativeWebView.postMessage = value => console.log(value);

function App() {
  const _draftEditorRef = createRef();
  const containerRef = useRef();

  const [mentionsURL, setMentionsURL] = useState(null);
  const [accessToken, setAccessToken] = useState(null);
  const [editorState, setEditorState] = useState(EditorState.createEmpty());
  const [placeholder, setPlaceholder] = useState("");
  const [editorStyle, setEditorStyle] = useState("");
  const [styleMap, setStyleMap] = useState({});
  const [blockRenderMap, setBlockRenderMap] = useState(Map({}));
  const [isMounted, setMountStatus] = useState(false);
  const [containerHeight, setContainerHeight] = useState(0);
  const [group, setGroup] = useState(null);

  //mention utils
  const [open, setOpen] = useState(false);
  const [suggestions, setSuggestions] = useState([]);
  const [mentions, setMentions] = useState([]);

    //channel mentions
    const [isChannelMentionsOpen, setIsChannelMentionsOpen] = React.useState(false);
    const [channelMentions, setChannelMentions] = React.useState([]);

  const onOpenChange = useCallback((_open) => {
    setOpen(_open);
  }, []);

  const onAddMention = mention => {
    setMentions([
      ...mentions,
      mention.id,
    ])
  }

  useEffect(() => {
    if (!isMounted) {
      setMountStatus(true);
      /**
       * componentDidMount action goes here...
       */
      if (window.ReactNativeWebView) {
        window.ReactNativeWebView.postMessage(
          JSON.stringify({
            isMounted: true
          })
        );
      }
    }
  }, [isMounted]);

  useEffect(() => {
    const updateHeight = () => {
      if (containerRef.current) {
        setContainerHeight(containerRef.current.offsetHeight);
      }
    };

    // Initial height setting
    updateHeight();

    const resizeObserver = new ResizeObserver(() => {
      updateHeight();
    });

    if (containerRef.current) {
      resizeObserver.observe(containerRef.current);
    }

    return () => {
      if (containerRef.current) {
        resizeObserver.unobserve(containerRef.current);
      }
    };
  }, []);


  useEffect(() => {
    if (window.ReactNativeWebView) {
      window.ReactNativeWebView.postMessage(
        JSON.stringify({
          containerHeight,
        })
      );
    }
  }, [containerHeight]);

  const onChange = (newEditorState) => {
    onEditorChange(newEditorState);
    setEditorState(newEditorState);
  }

  const onEditorChange = (newEditorState) => {
    const contentState = newEditorState.getCurrentContent();
    const rawContentState = convertToRaw(contentState);
    const newMentions = [];

    // Extract mentions from the raw content state
    rawContentState.blocks.forEach((block) => {
      if (block.entityRanges.length > 0) {
        block.entityRanges.forEach((entityRange) => {
          const entity = rawContentState.entityMap[entityRange.key];
          if (entity.type === 'mention') {
            newMentions.push(entity.data.mention.id);
          }
        });
      }
    });

    // Identify removed mentions
    const removedMentions = mentions.filter(mention => !newMentions.includes(mention));
    if (removedMentions.length > 0) {
      // Update mentions state to reflect removed mentions
      setMentions(newMentions);
    }
  };

  const onSearchChange = useCallback(({value}) => {
    onMentionSearchChange(value);
  }, [mentionsURL, accessToken])

  const onMentionSearchChange = async (searchValue) => {
    try {
      const response = await axios.get(`${mentionsURL}?nsearch=${searchValue}&limit=10`, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        }
      });
      setSuggestions(response.data.data.map(groupMember => ({
        name: groupMember.user.full_name,
        avatar: groupMember.user.profile_image,
        id: groupMember.user.id,
      })));
    } catch (error) {
      setSuggestions([
        {
          name: `URL ${mentionsURL}`,
          avatar: null,
          id: 1,
        },
        {
          name: `Access Token ${accessToken}`,
          avatar: null,
          id: 1,
        },
        {
          name: `Message ${error.message}`,
          avatar: null,
          id: 1,
        },
      ]);
    }
  }

  // channel mentions
  const onChannelMentionsOpen = useCallback((arg0) => {
    setIsChannelMentionsOpen(arg0);
  }, []);
  const onChannelsSearchChange = useCallback(({ value }) => {
    searchForChannels(value);
  }, []);

  const searchForChannels = (query) => {
    const groupChannels = (group && group.channels) ? group.channels : []
    const filteredChannels = groupChannels.filter((channel) =>
      channel.name.toLowerCase().includes(query.toLowerCase())
    );
    setChannelMentions(filteredChannels.map((channel) => {
      return {
        name: channel.name,
        avatar: channel.emoji,
        id: channel.id,
        slug: channel.slug,
      }
    }));
  }

  const handleKeyCommand = (command, editorState) => {
    const newState = RichUtils.handleKeyCommand(editorState, command);
    if (newState) {
      setEditorState(newState);
      return true;
    }
    return false;
  };

  const mapKeyToEditorCommand = e => {
    switch (e.keyCode) {
      case 9: // TAB
        const newEditorState = RichUtils.onTab(
          e,
          editorState,
          4 /* maxDepth */
        );
        if (newEditorState !== editorState) {
          setEditorState(newEditorState);
        }
        return;
      default:
        return getDefaultKeyBinding(e);
    }
  };

  const toggleBlockType = blockType => {
    setEditorState(RichUtils.toggleBlockType(editorState, blockType));
  };

  const toggleInlineStyle = inlineStyle => {
    setEditorState(RichUtils.toggleInlineStyle(editorState, inlineStyle));
  };

  const setDefaultValue = value => {
    try {
      if (value) {
        const contentState = convertFromRaw(JSON.parse(value));
        setEditorState(EditorState.createWithContent(contentState));
      }
    } catch (e) {
      console.error(e);
    }
  };

  const setEditorPlaceholder = placeholder => {
    setPlaceholder(placeholder);
  };

  const setEditorStyleSheet = styleSheet => {
    setEditorStyle(styleSheet);
  };

  const setEditorStyleMap = editorStyleMap => {
    setStyleMap(editorStyleMap);
  };

  const setMentionsURI = mentionsURL => {
    setMentionsURL(mentionsURL);
  }

  const setCommunityAccessToken = communityAccessToken => {
    setAccessToken(communityAccessToken);
  }

  const setCommunityData = stringifiedGroup => {
    setGroup(JSON.parse(stringifiedGroup));
  }

  const focusTextEditor = () => {
    _draftEditorRef.current && _draftEditorRef.current.focus();
  };

  const blurTextEditor = () => {
    _draftEditorRef.current && _draftEditorRef.current.blur();
  };

  const setEditorBlockRenderMap = renderMapString => {
    try {
      setBlockRenderMap(Map(JSON.parse(renderMapString)));
    } catch (e) {
      setBlockRenderMap(Map({}));
      console.error(e);
    }
  };

  const resetEditorState = () => {
    setEditorState(EditorState.createEmpty());
  }

  window.toggleBlockType = toggleBlockType;
  window.toggleInlineStyle = toggleInlineStyle;
  window.setDefaultValue = setDefaultValue;
  window.setEditorPlaceholder = setEditorPlaceholder;
  window.setEditorStyleSheet = setEditorStyleSheet;
  window.setEditorStyleMap = setEditorStyleMap;
  window.focusTextEditor = focusTextEditor;
  window.blurTextEditor = blurTextEditor;
  window.setEditorBlockRenderMap = setEditorBlockRenderMap;
  window.resetEditorState = resetEditorState;
  window.setMentionsURI = setMentionsURI;
  window.setCommunityAccessToken = setCommunityAccessToken;
  window.setCommunityData = setCommunityData;

  if (window.ReactNativeWebView) {
    window.ReactNativeWebView.postMessage(
      JSON.stringify({
        editorState: stateToHTML(editorState.getCurrentContent()),
        rawEditorState: convertToRaw(editorState.getCurrentContent()),
        mentions,
        mentionsOpen: open,
        channelMentions,
        channelMentionsOpen: isChannelMentionsOpen,
      })
    );
  }

  const customBlockRenderMap = DefaultDraftBlockRenderMap.merge(blockRenderMap);

  return (
    <>
      <style>
        {`
          *{background-color: transparent;}
          .DraftEditor-root{background-color: transparent; font-family: Arial, Helvetica, sans-serif;}
          .DraftEditor-editorContainer{background-color: transparent; font-size: 16px; font-family: Arial, Helvetica, sans-serif;}
          .public-DraftEditorPlaceholder-root{position: absolute;color: #767A8A; opacity: .5; font-family: Arial, Helvetica, sans-serif;}${editorStyle}
        `}
      </style>
      <div
      ref={containerRef}
      style={{
        width: '100%',
        height: 'fit-content',
        overflowY: 'scroll',
      }}
      >
        <Editor
        ref={_draftEditorRef}
        customStyleMap={styleMap}
        blockRenderMap={customBlockRenderMap}
        editorState={editorState}
        onChange={onChange}
        handleKeyCommand={handleKeyCommand}
        keyBindingFn={mapKeyToEditorCommand}
        placeholder={placeholder}
        plugins={plugins}
        />
      </div>
      <EditorController
        editorState={editorState}
        onToggleBlockType={toggleBlockType}
        onToggleInlineStyle={toggleInlineStyle}
      />
      <UserMentionSuggestions
        open={open}
        onOpenChange={onOpenChange}
        suggestions={suggestions}
        onSearchChange={onSearchChange}
        onAddMention={onAddMention}
        entryComponent={(EntryComponent)}
      />

      <ChannelMentionSuggestions
        open={isChannelMentionsOpen}
        onOpenChange={onChannelMentionsOpen}
        suggestions={channelMentions}
        onSearchChange={onChannelsSearchChange}
        onAddMention={onAddMention}
        entryComponent={(EntryComponent)}
      />
    </>
  );
}

export default App;
