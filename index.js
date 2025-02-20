import React, { Component } from "react";
import { ViewPropTypes, Platform } from "react-native";
import WebView from "react-native-webview";
import PropTypes from "prop-types";

const draftJsHtml = require("./draftjs-html-source/draftjs-source.html");

class RNDraftView extends Component {
  static propTypes = {
    style: ViewPropTypes.style,
    onStyleChanged: PropTypes.func,
    onBlockTypeChanged: PropTypes.func,
    defaultValue: PropTypes.string,
    placeholder: PropTypes.string,
    styleSheet: PropTypes.string,
    styleMap: PropTypes.object,
    blockRenderMap: PropTypes.object,
    onEditorReady: PropTypes.func,
    onMentionSuggestionsActive: PropTypes.func,
    mentionsURL: PropTypes.string,
    accessToken: PropTypes.string,
    onLayout: PropTypes.func,
    userChannels: PropTypes.array,
  };

  _webViewRef = React.createRef();

  state = {
    editorState: "",
    rawEditorState: null,
    mentions: [],
    channelMentions: [],
    channels: [],
  };

  executeScript = (functionName, parameter) => {
    this._webViewRef.current &&
      this._webViewRef.current.injectJavaScript(
        `window.${functionName}(${parameter ? `'${parameter}'` : ""});true;`
      );
  };

  setDefaultValue = (defaultValue) => {
    this._webViewRef.current &&
      this._webViewRef.current.injectJavaScript(
        `window.setDefaultValue(${JSON.stringify(defaultValue)});true;`
      );
  }

  setBlockType = blockType => {
    this.executeScript("toggleBlockType", blockType);
  };

  setStyle = style => {
    this.executeScript("toggleInlineStyle", style);
  };

  getMentions = () => {
    return this.state.mentions;
  }

  getChannelMentions = () => {
    return this.state.channelMentions;
  }

  getEditorState = () => {
    return [this.state.editorState, this.state.rawEditorState];
  };

  getProps = () => {
    return this.props;
  }

  _onMessage = event => {
    const {
      onStyleChanged = () => null,
      onBlockTypeChanged = () => null,
      onMentionSuggestionsActive = () => null,
    } = this.props;
    const { data } = event.nativeEvent;
    const { blockType, styles, editorState, rawEditorState, mentions, mentionsOpen, channelMentions, channelMentionsOpen, isMounted, containerHeight, channels } = JSON.parse(data);
    onStyleChanged(styles ? styles.split(",") : []);
    if (blockType) onBlockTypeChanged(blockType);
    if (editorState)
      this.setState({ editorState: editorState.replace(/(\r\n|\n|\r)/gm, "") });
    if(rawEditorState)
      this.setState({ rawEditorState, });
    if(mentions)
      this.setState({ mentions, });
    if(channelMentions)
      this.setState({ channelMentions, });
    if (isMounted) this.widgetMounted();
    if(mentionsOpen && onMentionSuggestionsActive) onMentionSuggestionsActive();
    if(channelMentionsOpen && onMentionSuggestionsActive) onMentionSuggestionsActive();
    if(typeof containerHeight === 'number' && !isNaN(containerHeight) && this.props.onLayout) {
      this.props.onLayout(containerHeight);
    }
    if(channels) 
        this.setState({ channels, });
  };

  widgetMounted = () => {
    const {
      placeholder,
      defaultValue,
      styleSheet,
      styleMap,
      blockRenderMap,
      onEditorReady = () => null,
      mentionsURL,
      accessToken,
      userChannels,
    } = this.props;
    if(mentionsURL) {
      this.executeScript("setMentionsURI", mentionsURL);
    }
    if(accessToken) {
      this.executeScript("setCommunityAccessToken", accessToken);
    }
    if (defaultValue) {
      this.setDefaultValue(defaultValue);
    }
    if (placeholder) {
      this.executeScript("setEditorPlaceholder", placeholder);
    }
    if (styleSheet) {
      this.executeScript("setEditorStyleSheet", styleSheet);
    }
    if (userChannels) {
      this.executeScript("setUserChannels", userChannels);
    }
    if (styleMap) {
      try {
        this.executeScript("setEditorStyleMap", JSON.stringify(styleMap));
      } catch (e) {
        console.error(e);
      }
    }
    if (blockRenderMap) {
      try {
        this.executeScript(
          "setEditorBlockRenderMap",
          JSON.stringify(blockRenderMap)
        );
      } catch (e) {
        console.error(e);
      }
    }
    onEditorReady();
  };

  focus = () => {
    this.executeScript("focusTextEditor");
  };

  blur = () => {
    this.executeScript("blurTextEditor");
  };

  resetEditorState = () => {
    this.executeScript("resetEditorState");
  }

  render() {
    const { style = { flex: 1 } } = this.props;
    return (
      <WebView
        ref={this._webViewRef}
        style={style}
        source={
          Platform.OS === "ios"
            ? draftJsHtml
            : { uri: "file:///android_asset/draftjs-source.html" }
        }
        useWebKit={true}
        keyboardDisplayRequiresUserAction={false}
        originWhitelist={["*"]}
        onMessage={this._onMessage}
        scrollEnabled={false}
        scalesPageToFit={Platform.OS === 'android'}
      />
    );
  }
}

export default RNDraftView;
