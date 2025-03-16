import { definePlugin } from "@api/plugins";
import { Devs } from "@utils/constants";
import { findByPropsLazy } from "@webpack";
import { Flex } from "@components/Flex";
import { Forms } from "@components/Forms";
import { Button } from "@components/Button";
import { showToast } from "@api/Notifications";
import { addContextMenuPatch } from "@api/ContextMenu";
import { after } from "@api/Patcher";

// Get Discord's internal modules
const MessageStore = findByPropsLazy("getMessage", "getMessages");
const UserStore = findByPropsLazy("getUser", "getUsers");
const ChannelStore = findByPropsLazy("getChannel", "getDMFromUserId");
const VoiceControlsStore = findByPropsLazy("getVoiceControls", "isMute");
const VoiceControlsComponent = findByPropsLazy("VoiceControlButton", "default");

// Define the plugin
export default definePlugin({
    name: "FunDiscordEnhancements",
    description: "Adds fun enhancements to your Discord experience",
    authors: [Devs.You],
    
    // Settings for the plugin
    settings: {
        animatedText: {
            type: "boolean",
            default: true,
            description: "Enable rainbow text animation for messages"
        },
        emojiZoom: {
            type: "boolean",
            default: true,
            description: "Zoom emojis on hover"
        }
    },
    
    // Patcher unpatchers
    voiceButtonPatch: null,
    
    // Code to run when the plugin starts
    start() {
        // Add custom CSS for animations and effects
        this.injectStyles();
        
        // Add context menu options
        this.patchMessageContextMenu();
        
        // Add button next to mic controls
        this.addVoiceControlButton();
        
        // Log that plugin started
        console.log("FunDiscordEnhancements plugin started!");
    },
    
    // Code to run when the plugin stops
    stop() {
        // Remove all modifications
        document.getElementById("fun-enhancements-styles")?.remove();
        
        // Remove patchers
        if (this.voiceButtonPatch) this.voiceButtonPatch();
        
        // Log that plugin stopped
        console.log("FunDiscordEnhancements plugin stopped!");
    },
    
    // Add custom CSS
    injectStyles() {
        const style = document.createElement("style");
        style.id = "fun-enhancements-styles";
        style.textContent = `
            /* Rainbow text effect for messages when enabled */
            .fun-rainbow-text {
                animation: rainbow-text 6s infinite;
            }
            
            @keyframes rainbow-text {
                0% { color: #ff0000; }
                16.6% { color: #ff9900; }
                33.3% { color: #33cc33; }
                50% { color: #3399ff; }
                66.6% { color: #cc33cc; }
                83.3% { color: #ff3399; }
                100% { color: #ff0000; }
            }
            
            /* Emoji zoom effect when enabled */
            ${this.settings.store.emojiZoom ? `
                .emojiContainer-3X8SvE:hover {
                    transform: scale(2);
                    transition: transform 0.2s;
                    z-index: 100;
                }
            ` : ''}
            
            /* Custom animations for messages */
            .message-2CShn3.fun-enhanced {
                transition: all 0.3s ease;
            }
            
            .message-2CShn3.fun-enhanced:hover {
                transform: translateY(-2px);
                box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
            }
            
            /* Custom button styling */
            .fun-custom-button {
                background: linear-gradient(45deg, #8c14fc, #a537fd);
                border-radius: 8px;
                transition: all 0.3s ease;
            }
            
            .fun-custom-button:hover {
                transform: translateY(-2px);
                box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
            }
            
            /* Voice button animation */
            .fun-voice-button {
                position: relative;
                overflow: hidden;
            }
            
            .fun-voice-button::after {
                content: "";
                position: absolute;
                top: -50%;
                left: -50%;
                width: 200%;
                height: 200%;
                background: linear-gradient(
                    to bottom right,
                    rgba(255, 0, 0, 0) 0%,
                    rgba(255, 0, 0, 0) 40%,
                    rgba(255, 0, 0, 0.8) 50%,
                    rgba(255, 0, 0, 0) 60%,
                    rgba(255, 0, 0, 0) 100%
                );
                transform: rotate(45deg);
                animation: shine 3s infinite;
            }
            
            @keyframes shine {
                0% { top: -50%; left: -50%; }
                100% { top: 50%; left: 50%; }
            }
            
            /* Shake animation for dramatic effect */
            @keyframes shake {
                0% { transform: translateX(0); }
                25% { transform: translateX(5px); }
                50% { transform: translateX(-5px); }
                75% { transform: translateX(5px); }
                100% { transform: translateX(0); }
            }
        `;
        document.head.appendChild(style);
    },
    
    // Add context menu options to messages
    patchMessageContextMenu() {
        addContextMenuPatch("message", (ctx, props) => {
            // Add custom section to message context menu
            ctx.splice(4, 0, {
                type: "submenu",
                label: "Fun Enhancements",
                items: [
                    {
                        label: "Rainbow Text",
                        id: "fun-rainbow-text",
                        action: () => {
                            const messageElement = document.getElementById(`chat-messages-${props.message.id}`);
                            if (messageElement) {
                                const contentElement = messageElement.querySelector(".contents-2MsGLg");
                                contentElement.classList.toggle("fun-rainbow-text");
                                showToast("Rainbow text effect toggled!", { type: "success" });
                            }
                        }
                    },
                    {
                        label: "Dramatic Effect",
                        id: "fun-dramatic",
                        action: () => {
                            const messageElement = document.getElementById(`chat-messages-${props.message.id}`);
                            if (messageElement) {
                                messageElement.style.animation = "shake 0.5s";
                                setTimeout(() => {
                                    messageElement.style.animation = "";
                                }, 500);
                                showToast("Dramatic effect applied!", { type: "success" });
                            }
                        }
                    }
                ]
            });
        });
    },
    
    // Add button next to microphone controls
    addVoiceControlButton() {
        // Find the voice controls component
        let isActive = false;
        
        // Patch the voice controls component
        this.voiceButtonPatch = after("default", VoiceControlsComponent, (_, res) => {
            if (!res || !res.props || !res.props.children) return res;
            
            // Find the container with the microphone buttons
            const buttonContainer = res.props.children.find(child => 
                child && child.props && Array.isArray(child.props.children) && 
                child.props.children.some(button => 
                    button && button.props && button.props.tooltipText && 
                    (button.props.tooltipText.includes("Mute") || button.props.tooltipText.includes("Unmute"))
                )
            );
            
            if (!buttonContainer || !Array.isArray(buttonContainer.props.children)) return res;
            
            // Create our custom button component
            const funButton = React.createElement("div", {
                className: "buttonContainer-28fw2U",
                children: React.createElement("button", {
                    className: `button-1EGGcP buttonColor-3bP3fX ${isActive ? "buttonActive-Uc1jHx" : ""} fun-voice-button`,
                    onClick: () => {
                        isActive = !isActive;
                        this.toggleVoiceEffect(isActive);
                    },
                    "aria-label": "Fun Voice Effect",
                    children: React.createElement("svg", {
                        width: "20",
                        height: "20",
                        viewBox: "0 0 24 24",
                        fill: "currentColor",
                        children: [
                            React.createElement("path", {
                                d: "M14.99 11C14.99 12.66 13.66 14 12 14C10.34 14 9 12.66 9 11V5C9 3.34 10.34 2 12 2C13.66 2 15 3.34 15 5L14.99 11ZM12 16.1C14.76 16.1 17.3 14 17.3 11H19C19 14.42 16.28 17.24 13 17.72V21H11V17.72C7.72 17.23 5 14.41 5 11H6.7C6.7 14 9.24 16.1 12 16.1ZM12 4C11.2 4 11 4.66667 11 5V11C11 11.3333 11.2 12 12 12C12.8 12 13 11.3333 13 11V5C13 4.66667 12.8 4 12 4Z",
                                fill: "currentColor"
                            }),
                            React.createElement("path", {
                                d: "M14 18.23C13.34 18.58 12.69 18.91 12 19.2C11.31 18.91 10.66 18.58 10 18.23M6 18C6.65 19.23 7.57 20.28 8.7 21.05C9.09 21.32 9.5 21.55 9.94 21.75C10.34 21.93 10.76 22.1 11.2 22.22C11.45 22.29 11.72 22.36 12 22.39C12.28 22.36 12.55 22.29 12.8 22.22C13.24 22.1 13.66 21.93 14.06 21.75C14.5 21.55 14.91 21.32 15.3 21.05C16.43 20.28 17.35 19.23 18 18",
                                stroke: "currentColor",
                                strokeWidth: "2",
                                fill: "none"
                            })
                        ]
                    })
                })
            });
            
            // Add our button to the container
            buttonContainer.props.children.splice(buttonContainer.props.children.length - 1, 0, funButton);
            
            return res;
        });
    },
    
    // Toggle fun voice effect
    toggleVoiceEffect(isActive) {
        if (isActive) {
            showToast("Fun Voice Effect activated!", { type: "success" });
            // Here you would implement the actual voice effect
            // This is just a visual indicator without actual voice modification
            document.querySelectorAll(".speaking-B2MXPi").forEach(el => {
                el.style.animation = "rainbow-text 3s infinite";
            });
        } else {
            showToast("Fun Voice Effect deactivated", { type: "info" });
            document.querySelectorAll(".speaking-B2MXPi").forEach(el => {
                el.style.animation = "";
            });
        }
    }
});
