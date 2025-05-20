<template>
  <div class="quotesync-chat" :class="{ 'dark-theme': isDarkTheme }">
    <!-- Debug info to check the theme status -->
    <div class="debug-theme" v-if="false">
      Theme: {{ isDarkTheme ? 'Dark' : 'Light' }}
    </div>
    
    <div class="chat-layout">
      <!-- Left Sidebar -->
      <div class="chat-sidebar">
        <div class="sidebar-header">
          <div class="logo-container">
            <i class="pi pi-book-open text-indigo-500 text-2xl"></i>
            <h2 class="app-name">QuoteSync<span class="text-indigo-500">AI</span></h2>
          </div>
        </div>
        
        <div class="sidebar-content">
          <div class="quick-prompts">
            <h3 class="text-lg font-semibold mb-4">Quick Prompts</h3>
            <div class="quick-prompt-list">
              <div
                v-for="(prompt, idx) in quickPrompts" 
                :key="idx" 
                class="quick-prompt-item"
                @click="setExampleQuestion(prompt)"
              >
                <i class="pi pi-bolt text-yellow-500 mr-2"></i>
                <span>{{ prompt }}</span>
              </div>
            </div>
          </div>
          
          <div class="context-container mt-8">
            <h3 class="text-lg font-semibold mb-4">Context</h3>
            <div v-if="contextObject" class="context-object">
              <template v-if="contextObject.type === 'quote'">
                <div class="context-quote">
                  <i class="pi pi-quote-left text-indigo-300 opacity-50 text-xl"></i>
                  <p class="italic my-2">{{ contextObject.body }}</p>
                  <i class="pi pi-quote-right text-indigo-300 opacity-50 text-xl ml-auto"></i>
                  <div class="text-sm text-gray-500 mt-2">
                    {{ contextObject.source }}
                  </div>
                </div>
              </template>
              <template v-else-if="contextObject.type === 'book'">
                <div class="context-book flex items-center gap-2">
                  <i class="pi pi-book text-indigo-500 text-2xl"></i>
                  <div>
                    <div class="font-semibold">{{ contextObject.title }}</div>
                    <div class="text-sm text-gray-500">{{ contextObject.author }}</div>
                  </div>
                </div>
              </template>
              <template v-else-if="contextObject.type === 'author'">
                <div class="context-author flex items-center gap-2">
                  <i class="pi pi-user text-indigo-500 text-2xl"></i>
                  <div class="font-semibold">{{ contextObject.name }}</div>
                </div>
              </template>
            </div>
            <div v-else class="text-sm text-gray-500 italic">
              No specific context. Ask about any quote, book, or author in your collection.
            </div>
          </div>
        </div>
      </div>
      
      <!-- Main Chat Area -->
      <div class="chat-main">
        <div class="chat-header">
          <div class="flex justify-between items-center">
            <div>
              <h1 class="text-2xl font-bold">Chat with QuoteSyncAI</h1>
              <p class="text-gray-500">Ask me anything about your literary collection</p>
            </div>
            <div class="service-selector">
              <Button 
                :label="aiService === 'quotesync' ? 'Using: QuoteSyncAI' : 'Using: Claude'" 
                :icon="aiService === 'quotesync' ? 'pi pi-cloud' : 'pi pi-star'" 
                class="p-button-sm p-button-outlined"
                @click="toggleAIService"
                v-tooltip.bottom="'Click to switch AI service'"
              />
            </div>
          </div>
        </div>
        
        <!-- Chat Messages -->
        <div ref="messagesContainer" class="chat-history" @scroll="handleScroll">
          <div 
            v-for="(message, index) in chatHistory" 
            :key="index" 
            :class="['message-container', message.role === 'user' ? 'user-message' : 'ai-message']"
          >
            <!-- User Message -->
            <template v-if="message.role === 'user'">
              <div class="message user">
                <div class="message-header">
                  <div class="avatar user-avatar">
                    <i class="pi pi-user"></i>
                  </div>
                  <div class="message-meta">
                    <div class="message-role">You</div>
                  </div>
                </div>
                <div class="message-content prose dark:prose-invert">
                  {{ message.content }}
                </div>
              </div>
            </template>
            
            <!-- AI Message -->
            <template v-else>
              <div class="message assistant">
                <div class="message-header" :style="{ 
                  backgroundColor: isDarkTheme ? '#1e293b' : '#1e293b',
                  color: isDarkTheme ? '#ffffff' : '#ffffff' 
                }">
                  <div class="avatar ai-avatar" :style="{
                    backgroundColor: message.service === 'claude' ? '#10a37f' : '#4f46e5',
                    border: isDarkTheme ? '2px solid #1e293b' : '2px solid white'
                  }">
                    <i :class="message.service === 'claude' ? 'pi pi-star' : 'pi pi-book'" style="font-size: 1.2rem; color: white;"></i>
                  </div>
                  <div class="message-meta">
                    <div class="message-role" :style="{ color: isDarkTheme ? 'white' : 'white' }">
                      {{ message.service === 'claude' ? 'Claude by Anthropic' : 'QuoteSyncAI' }}
                    </div>
                  </div>
                </div>
                <div class="message-body">
                  <div 
                    class="message-content prose dark:prose-invert" 
                    v-html="formatMessage(message.content)"
                  ></div>
                  
                  <!-- Context Quotes (if available) -->
                  <div v-if="message.context && message.context.length > 0" class="context-quotes">
                    <div class="context-quotes-header">
                      <i class="pi pi-book text-indigo-500 mr-1"></i>
                      <span>Referenced quotes:</span>
                    </div>
                    <div 
                      v-for="(context, ctxIndex) in message.context" 
                      :key="ctxIndex"
                      class="context-quote"
                    >
                      <div class="quote-content">
                        <div class="quote-text">
                          <i class="pi pi-quote-left text-indigo-500 text-sm"></i>
                          <span class="italic">{{ context.quote }}</span>
                          <i class="pi pi-quote-right text-indigo-500 text-sm"></i>
                        </div>
                        <div class="quote-source">{{ context.source }}</div>
                        
                        <div v-if="displayableTags(context.tags).length > 0" class="quote-tags">
                          <span 
                            v-for="(tag, idx) in displayableTags(context.tags)" 
                            :key="idx" 
                            class="tag-pill"
                          >
                            <i class="pi pi-tag text-xs mr-1"></i>{{ tag }}
                          </span>
                        </div>
                      </div>
                      <div class="quote-decoration"></div>
                    </div>
                  </div>
                </div>
              </div>
            </template>
          </div>
          
          <!-- Typing Indicator -->
          <div v-if="isTyping" class="message-container ai-message">
            <div class="message assistant">
              <div class="message-header" :style="{ 
                backgroundColor: isDarkTheme ? '#1e293b' : '#f9fafb',
                color: isDarkTheme ? '#ffffff' : '#111827' 
              }">
                <div class="avatar ai-avatar" :style="{
                  backgroundColor: aiService === 'claude' ? '#10a37f' : '#4f46e5',
                  border: isDarkTheme ? '2px solid #1e293b' : '2px solid white'
                }">
                  <i :class="aiService === 'claude' ? 'pi pi-star' : 'pi pi-book'" style="font-size: 1.2rem; color: white;"></i>
                </div>
                <div class="message-meta">
                  <div class="message-role" :style="{ color: isDarkTheme ? 'white' : '#111827' }">
                    {{ aiService === 'claude' ? 'Claude by Anthropic' : 'QuoteSyncAI' }}
                  </div>
                </div>
              </div>
              <div class="message-body">
                <div class="typing-indicator">
                  <div class="dot-typing"></div>
                  <div class="dot-typing animation-delay-200"></div>
                  <div class="dot-typing animation-delay-400"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <!-- Input Area -->
        <div class="chat-input-container">
          <div class="chat-input-wrapper">
            <textarea 
              v-model="question" 
              placeholder="Ask about your quotes..." 
              class="chat-input"
              rows="3"
              @keydown.enter.prevent="submitQuestion"
              :disabled="isTyping"
            ></textarea>
            <Button 
              v-if="!isTyping"
              icon="pi pi-send" 
              class="send-button"
              @click="submitQuestion"
              :disabled="!question.trim() || isTyping"
            />
            <Button 
              v-else
              icon="pi pi-times" 
              class="stop-button"
              @click="stopResponse"
              severity="danger"
            />
          </div>
          <div class="input-help-text">
            Press Enter to send. Ask about quotes, authors, themes, or get suggestions for your next reading.
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, nextTick, onMounted, onBeforeUnmount } from 'vue';
import { QuoteSyncChatService } from '@/service/QuoteSyncChatService';
import { AnthropicService } from '@/service/AnthropicService';
import { useLayout } from '@/layout/composables/layout';
import Button from 'primevue/button';
import { marked } from 'marked';
import DOMPurify from 'dompurify';

const props = defineProps({
  quote: {
    type: Object,
    default: null
  },
  book: {
    type: Object,
    default: null
  },
  author: {
    type: Object,
    default: null
  }
});

// State
const question = ref('');
const aiService = ref('claude'); // Default to using Claude
const chatHistory = ref([
  {
    role: 'assistant',
    content: 'Hello! I\'m Claude, your personal literary assistant. How can I help you explore your quotes today?',
    context: [],
    service: 'claude'
  }
]);
const isTyping = ref(false);
const streamController = ref(null);
const messagesContainer = ref(null);

// Quick prompts
const quickPrompts = [
  'What quotes do I have about courage?',
  'Find me quotes for a presentation on leadership',
  'Which author in my collection talks most about hope?',
  'Explain the deeper meaning of my quote about the road less traveled',
  'Recommend quotes similar to my favorite ones',
  'What themes appear most frequently in my collection?'
];

// Get theme information from the layout composable
const { isDarkTheme } = useLayout();

// Determine context object based on props
const contextObject = computed(() => {
  if (props.quote) {
    return {
      type: 'quote',
      body: props.quote.body,
      source: props.quote.book 
        ? `${props.quote.book.title}${props.quote.book.author ? ` by ${props.quote.book.author.name}` : ''}`
        : 'Unknown source'
    };
  } else if (props.book) {
    return {
      type: 'book',
      title: props.book.title,
      author: props.book.author ? props.book.author.name : 'Unknown author'
    };
  } else if (props.author) {
    return {
      type: 'author',
      name: props.author.name
    };
  }
  return null;
});

// If a quote is provided, add context about it
watch(() => props.quote, (newQuote) => {
  if (newQuote && newQuote.body) {
    // Add a system message with quote context
    chatHistory.value = [
      {
        role: 'assistant',
        content: `I'm here to help with your literary queries. You're currently viewing this quote:\n\n> "${newQuote.body}"\n\n${newQuote.book ? `From: ${newQuote.book.title}` : ''} ${newQuote.book?.author ? `by ${newQuote.book.author.name}` : ''}\n\nWhat would you like to know about it?`,
        context: [],
        service: 'claude'
      }
    ];
  }
}, { immediate: true });

// Methods
const formatMessage = (content) => {
  // Verificar si tenemos contenido de texto
  if (!content) return '';
  
  // Primero, formatear cualquier caso de [object Object] en el texto
  let formattedText = content.replace(/\[object Object\]/g, '');
  
  // Formatear los tags en las referencias de citas
  const tagPattern = /Tags: ((\[object Object\],?\s*)+)/g;
  formattedText = formattedText.replace(tagPattern, (match, tagsPart) => {
    return 'Tags: various tags';
  });
  
  // Convertir markdown a HTML y sanitizar
  const formattedContent = DOMPurify.sanitize(marked(formattedText));
  return formattedContent;
};

const scrollToBottom = () => {
  nextTick(() => {
    if (messagesContainer.value) {
      // Verificar si el usuario estaba en la parte inferior antes de actualizar
      const isAtBottom = isUserAtBottom();
      
      // Solo hacer auto-scroll si el usuario estaba en la parte inferior
      if (isAtBottom) {
        messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight;
      }
    }
  });
};

// Verificar si el usuario está en la parte inferior del chat
const isUserAtBottom = () => {
  if (!messagesContainer.value) return true;
  
  const { scrollTop, scrollHeight, clientHeight } = messagesContainer.value;
  const scrollBottom = scrollTop + clientHeight;
  
  // Consideramos que está en la parte inferior si está a menos de 100px del final
  return scrollHeight - scrollBottom < 100;
};

// Variables para control de scroll
const userHasScrolled = ref(false);
const lastScrollPosition = ref(0);

// Manejar evento de scroll manual del usuario
const handleScroll = () => {
  if (!messagesContainer.value) return;
  
  // Guardar la posición de scroll para referencia
  lastScrollPosition.value = messagesContainer.value.scrollTop;
  
  // Marcar que el usuario ha desplazado manualmente
  userHasScrolled.value = true;
  
  // Resetear el flag si el usuario llega al fondo
  if (isUserAtBottom()) {
    userHasScrolled.value = false;
  }
};

const stopResponse = () => {
  if (streamController.value) {
    // Call the cancel method on the controller
    streamController.value.abort();
    isTyping.value = false;
  }
};

const toggleAIService = () => {
  aiService.value = aiService.value === 'quotesync' ? 'claude' : 'quotesync';
  
  // Add a system message about the switch
  chatHistory.value.push({
    role: 'assistant',
    content: `I'm now using ${aiService.value === 'quotesync' ? 'QuoteSyncAI' : 'Claude by Anthropic'} to answer your questions. How can I help you?`,
    context: [],
    service: aiService.value
  });
  
  scrollToBottom();
};

const submitQuestion = async () => {
  if (!question.value.trim() || isTyping.value) return;
  
  // Add user message to chat history
  const userMessage = {
    role: 'user',
    content: question.value.trim()
  };
  chatHistory.value.push(userMessage);
  
  // Clear input
  const currentQuestion = question.value.trim();
  question.value = '';
  scrollToBottom();
  
  // Set typing indicator
  isTyping.value = true;
  
  try {
    // Create messages array from chat history
    const messages = chatHistory.value.map(msg => ({
      role: msg.role,
      content: msg.content
    }));

    // Stream the response
    let responseContent = '';
    let contextData = [];
    
    // Create a new AbortController for this request
    streamController.value = new AbortController();
    
    if (aiService.value === 'claude') {
      // Use Anthropic Claude service
      try {
        console.log('Calling Claude API...');
        const result = await AnthropicService.generateResponse(currentQuestion);
        console.log('Claude API response:', result);
        
        // Add assistant response
        chatHistory.value.push({
          role: 'assistant',
          content: result.response || "I'm sorry, I couldn't generate a response.",
          context: [],
          service: 'claude'
        });
      } catch (error) {
        console.error('Error with Claude:', error);
        chatHistory.value.push({
          role: 'assistant',
          content: 'Sorry, I encountered an error while processing your request with Claude. Please try again or switch to QuoteSyncAI.',
          context: [],
          service: 'claude'
        });
      } finally {
        isTyping.value = false;
        scrollToBottom();
      }
    } else {
      // Use QuoteSyncChat service
      try {
        QuoteSyncChatService.streamChat(
          messages,
          (chunk) => {
            if (chunk && chunk.message) {
              // If we have context data
              if (chunk.context) {
                contextData = chunk.context;
              }
              
              // Append to the current response
              if (chunk.message.content) {
                responseContent = chunk.message.content;
                
                // Update UI with current response text
                if (chatHistory.value[chatHistory.value.length - 1].role === 'assistant') {
                  // Update existing assistant message
                  chatHistory.value[chatHistory.value.length - 1].content = responseContent;
                  chatHistory.value[chatHistory.value.length - 1].context = contextData;
                } else {
                  // Add new assistant message
                  chatHistory.value.push({
                    role: 'assistant',
                    content: responseContent,
                    context: contextData,
                    service: 'quotesync'
                  });
                }
                scrollToBottom();
              }
            }
          },
          // On done
          () => {
            isTyping.value = false;
            scrollToBottom();
          },
          // On error
          (error) => {
            console.error('Error streaming chat response:', error);
            isTyping.value = false;
            
            // Add error message
            chatHistory.value.push({
              role: 'assistant',
              content: 'Sorry, I encountered an error while processing your request. Please try again.',
              context: [],
              service: 'quotesync'
            });
            scrollToBottom();
          },
          // Pass the abort signal to the service
          streamController.value.signal
        );
      } catch (error) {
        console.error('Error initializing chat stream:', error);
        isTyping.value = false;
        chatHistory.value.push({
          role: 'assistant',
          content: 'Sorry, I encountered an error setting up the chat stream. Please try again.',
          context: [],
          service: 'quotesync'
        });
        scrollToBottom();
      }
    }
  } catch (error) {
    console.error('Error in chat:', error);
    isTyping.value = false;
    
    // Add error message
    chatHistory.value.push({
      role: 'assistant',
      content: 'Sorry, I encountered an error while processing your request. Please try again.',
      context: [],
      service: aiService.value
    });
    scrollToBottom();
  }
};

const setExampleQuestion = (exampleQuestion) => {
  question.value = exampleQuestion;
};

// Auto-scroll when new messages arrive
watch(() => chatHistory.value.length, () => {
  scrollToBottom();
});

// Initial scroll to bottom and set up scroll event listener
onMounted(() => {
  scrollToBottom();
  
  // Agregar event listener para detectar scroll manual
  if (messagesContainer.value) {
    messagesContainer.value.addEventListener('scroll', handleScroll);
  }
});

// Clean up event listener
onBeforeUnmount(() => {
  // Cancel any ongoing requests when component unmounts
  if (streamController.value) {
    streamController.value.abort();
  }
  
  // Eliminar event listener
  if (messagesContainer.value) {
    messagesContainer.value.removeEventListener('scroll', handleScroll);
  }
});

// Método para verificar y formatear los tags para que sean mostrables
const displayableTags = (tags) => {
  if (!tags) return [];
  
  if (Array.isArray(tags)) {
    return tags.map(tag => {
      if (typeof tag === 'string') return tag;
      if (typeof tag === 'object' && tag !== null) {
        if (tag.name) return tag.name;
        return JSON.stringify(tag);
      }
      return String(tag);
    }).filter(tag => tag && typeof tag === 'string' && tag.trim() !== '');
  }
  
  if (typeof tags === 'string') {
    return tags.split(',').map(t => t.trim()).filter(Boolean);
  }
  
  return [];
};
</script>

<style scoped>
.quotesync-chat {
  display: flex;
  flex-direction: column;
  width: 100%;
  height: 100vh;
  background-color: var(--surface-ground, #f9fafb);
}

.quotesync-chat.dark-theme {
  background-color: var(--surface-ground, #111827);
}

.chat-layout {
  display: flex;
  width: 100%;
  height: 100%;
  overflow: hidden;
}

/* Sidebar */
.chat-sidebar {
  width: 340px;
  height: 100%;
  background-color: var(--surface-card, #fff);
  border-right: 1px solid var(--surface-border, #e5e7eb);
  display: flex;
  flex-direction: column;
  flex-shrink: 0;
}

.dark-theme .chat-sidebar {
  background-color: var(--surface-card, #1f2937);
  border-color: var(--surface-border, #374151);
}

.sidebar-header {
  padding: 1.5rem;
  border-bottom: 1px solid var(--surface-border, #e5e7eb);
}

.dark-theme .sidebar-header {
  border-color: var(--surface-border, #374151);
}

.logo-container {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.logo {
  width: 32px;
  height: 32px;
}

.app-name {
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--text-color, #111827);
}

.dark-theme .app-name {
  color: var(--text-color, #f9fafb);
}

.sidebar-content {
  padding: 1.5rem;
  overflow-y: auto;
  flex-grow: 1;
}

.quick-prompts {
  margin-bottom: 2rem;
}

.quick-prompt-list {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.quick-prompt-item {
  padding: 0.75rem;
  border-radius: 0.5rem;
  background-color: var(--surface-hover, #f3f4f6);
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
}

.dark-theme .quick-prompt-item {
  background-color: var(--surface-hover, #283548);
}

.quick-prompt-item:hover {
  background-color: var(--surface-hover, #e5e7eb);
  transform: translateY(-2px);
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
}

.dark-theme .quick-prompt-item:hover {
  background-color: var(--surface-hover, #374151);
}

.context-object {
  padding: 1rem;
  border-radius: 0.5rem;
  background-color: var(--surface-hover, #f3f4f6);
}

.dark-theme .context-object {
  background-color: var(--surface-hover, #283548);
}

.context-quote {
  padding: 1rem;
  background-color: var(--surface-section, #f9fafb);
  border-radius: 0.75rem;
  margin-bottom: 1rem;
  font-size: 0.95rem;
  border-left: 4px solid var(--primary-color, #4f46e5);
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.quote-content {
  position: relative;
  z-index: 2;
}

.quote-decoration {
  position: absolute;
  top: 0;
  right: 0;
  width: 100px;
  height: 100px;
  background: linear-gradient(135deg, rgba(79, 70, 229, 0.1) 0%, transparent 70%);
  border-radius: 0 0 0 100px;
  z-index: 1;
}

.context-quote:hover {
  transform: translateY(-3px);
  box-shadow: 0 8px 15px rgba(0, 0, 0, 0.1);
  border-left-width: 6px;
}

.dark-theme .context-quote {
  background-color: var(--surface-card, #1e293b);
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.2);
}

.quote-text {
  margin-bottom: 0.75rem;
  line-height: 1.6;
  font-family: 'Georgia', serif;
  font-size: 1.05rem;
  color: var(--text-color-secondary, #4b5563);
  position: relative;
  padding: 0 1.5rem;
}

.quote-text i.pi-quote-left {
  position: absolute;
  left: 0;
  top: 0.25rem;
  color: var(--primary-color, #4f46e5);
  opacity: 0.6;
}

.quote-text i.pi-quote-right {
  position: absolute;
  right: 0;
  bottom: 0.25rem;
  color: var(--primary-color, #4f46e5);
  opacity: 0.6;
}

.dark-theme .quote-text {
  color: var(--text-color, #e2e8f0);
}

.quote-source {
  font-size: 0.85rem;
  color: var(--text-color-secondary, #6b7280);
  margin-bottom: 0.75rem;
  font-weight: 600;
  padding-left: 1.5rem;
  position: relative;
}

.quote-source::before {
  content: "—";
  position: absolute;
  left: 0.5rem;
  color: var(--primary-color, #4f46e5);
  opacity: 0.7;
}

.dark-theme .quote-source {
  color: var(--text-color-secondary, #9ca3af);
}

.quote-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 0.4rem;
  margin-top: 0.75rem;
  padding-left: 1.5rem;
}

.tag-pill {
  font-size: 0.7rem;
  padding: 0.2rem 0.6rem;
  background-color: var(--primary-100, #e0e7ff);
  color: var(--primary-700, #4338ca);
  border-radius: 2rem;
  font-weight: 500;
  letter-spacing: 0.025em;
  transition: all 0.2s ease;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
}

.tag-pill:hover {
  transform: translateY(-1px);
  background-color: var(--primary-200, #c7d2fe);
}

.dark-theme .tag-pill {
  background-color: var(--primary-900, #312e81);
  color: var(--primary-100, #e0e7ff);
}

.dark-theme .tag-pill:hover {
  background-color: var(--primary-800, #3730a3);
}

/* Main Chat Area */
.chat-main {
  flex-grow: 1;
  display: flex;
  flex-direction: column;
  height: 100%;
}

.chat-header {
  padding: 1.5rem;
  border-bottom: 1px solid var(--surface-border, #e5e7eb);
  background-color: var(--surface-card, #fff);
}

.dark-theme .chat-header {
  background-color: var(--surface-card, #1f2937);
  border-color: var(--surface-border, #374151);
}

.chat-history {
  flex-grow: 1;
  overflow-y: auto;
  padding: 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.message-container {
  display: flex;
  justify-content: flex-start;
  max-width: 80%;
}

.message-container.user-message {
  justify-content: flex-end;
  margin-left: auto;
}

.message {
  border-radius: 0.75rem;
  overflow: hidden;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
}

.message.user {
  background-color: var(--primary-color, #4f46e5);
  color: var(--primary-color-text, white);
}

.message.assistant {
  background-color: var(--surface-card, #fff) !important;
  border: 1px solid var(--surface-border, #e5e7eb);
  color: var(--text-color, #111827) !important;
}

.dark-theme .message.assistant {
  background-color: var(--surface-700, #374151) !important; /* Slightly lighter than the darkest background */
  border-color: var(--surface-800, #1f2937);
  color: white !important;
}

.message-header {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1rem;
  border-bottom: 1px solid rgba(0, 0, 0, 0.1);
}

.message.user .message-header {
  background-color: rgba(0, 0, 0, 0.1);
  color: white;
}

.dark-theme .message.user .message-header {
  background-color: rgba(0, 0, 0, 0.2);
  color: white;
}

.message.assistant .message-header {
  background-color: var(--surface-section, #f9fafb);
  color: var(--text-color, #111827);
  border-bottom: 1px solid var(--surface-border, #e5e7eb);
}

.dark-theme .message.assistant .message-header {
  background-color: var(--surface-900, #1f2937);
  color: white !important;
  border-bottom: 1px solid var(--surface-700, #374151);
}

.message-meta {
  display: flex;
  flex-direction: column;
  line-height: 1.2;
}

.message-role {
  font-weight: 700;
  font-size: 0.875rem;
  color: inherit;
  margin-bottom: 2px;
}

.message-badge {
  font-size: 0.7rem;
  color: var(--primary-color, #6366f1);
  font-weight: 500;
}

.dark-theme .message-badge {
  color: white !important;
  background-color: var(--primary-700, #4338ca);
  padding: 0.1rem 0.4rem;
  border-radius: 0.25rem;
  display: inline-block;
  font-weight: 500;
  text-shadow: 0 0 5px rgba(255, 255, 255, 0.3);
}

.dark-theme .message.assistant {
  color-scheme: dark;
}

.dark-theme .message.assistant .message-role {
  color: rgba(255, 255, 255, 0.95) !important;
}

.avatar {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.avatar i {
  font-size: 1.2rem;
}

.ai-avatar {
  background: var(--primary-color, #4f46e5);
  color: white;
  border: 2px solid white;
}

.dark-theme .ai-avatar {
  background: var(--primary-color, #6366f1);
  color: white;
  border: 2px solid var(--surface-card, #1f2937);
}

.user-avatar {
  background: linear-gradient(135deg, var(--surface-500, #64748b), var(--surface-700, #334155));
  color: white;
}

.message-body {
  padding: 1rem;
}

.message-content {
  line-height: 1.5;
  color: var(--text-color, #111827);
}

.dark-theme .message-content {
  color: #ffffff !important;
}

.message.user .message-content {
  padding: 1rem;
  color: white;
}

.context-quotes {
  margin-top: 1rem;
  padding-top: 1rem;
  border-top: 1px solid #e5e7eb;
}

.context-quotes-header {
  font-size: 0.75rem;
  color: #6b7280;
  margin-bottom: 0.5rem;
  display: flex;
  align-items: center;
}

.context-quote {
  padding: 1rem;
  background-color: var(--surface-section, #f9fafb);
  border-radius: 0.75rem;
  margin-bottom: 1rem;
  font-size: 0.95rem;
  border-left: 4px solid var(--primary-color, #4f46e5);
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;
}

.context-quote::before {
  content: "";
  position: absolute;
  top: 0;
  right: 0;
  width: 60px;
  height: 60px;
  background: linear-gradient(135deg, rgba(79, 70, 229, 0.1) 0%, transparent 50%);
  border-radius: 0 0 0 60px;
  z-index: 1;
}

.context-quote:hover {
  transform: translateY(-3px);
  box-shadow: 0 8px 15px rgba(0, 0, 0, 0.1);
  border-left-width: 6px;
}

.dark-theme .context-quote {
  background-color: var(--surface-card, #1e293b);
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.2);
}

.quote-text {
  margin-bottom: 0.75rem;
  line-height: 1.6;
  font-family: 'Georgia', serif;
  font-size: 1.05rem;
  color: var(--text-color-secondary, #4b5563);
  position: relative;
  padding: 0 1.5rem;
}

.quote-text i.pi-quote-left {
  position: absolute;
  left: 0;
  top: 0.25rem;
  color: var(--primary-color, #4f46e5);
  opacity: 0.6;
}

.quote-text i.pi-quote-right {
  position: absolute;
  right: 0;
  bottom: 0.25rem;
  color: var(--primary-color, #4f46e5);
  opacity: 0.6;
}

.dark-theme .quote-text {
  color: var(--text-color, #e2e8f0);
}

.quote-source {
  font-size: 0.85rem;
  color: var(--text-color-secondary, #6b7280);
  margin-bottom: 0.75rem;
  font-weight: 600;
  padding-left: 1.5rem;
  position: relative;
}

.quote-source::before {
  content: "—";
  position: absolute;
  left: 0.5rem;
  color: var(--primary-color, #4f46e5);
  opacity: 0.7;
}

.dark-theme .quote-source {
  color: var(--text-color-secondary, #9ca3af);
}

.quote-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 0.4rem;
  margin-top: 0.75rem;
  padding-left: 1.5rem;
}

.tag-pill {
  font-size: 0.7rem;
  padding: 0.2rem 0.6rem;
  background-color: var(--primary-100, #e0e7ff);
  color: var(--primary-700, #4338ca);
  border-radius: 2rem;
  font-weight: 500;
  letter-spacing: 0.025em;
  transition: all 0.2s ease;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
}

.tag-pill:hover {
  transform: translateY(-1px);
  background-color: var(--primary-200, #c7d2fe);
}

.dark-theme .tag-pill {
  background-color: var(--primary-900, #312e81);
  color: var(--primary-100, #e0e7ff);
}

.dark-theme .tag-pill:hover {
  background-color: var(--primary-800, #3730a3);
}

/* Chat Input */
.chat-input-container {
  padding: 1.5rem;
  background-color: var(--surface-card, #fff);
  border-top: 1px solid var(--surface-border, #e5e7eb);
}

.dark-theme .chat-input-container {
  background-color: var(--surface-card, #1f2937);
  border-color: var(--surface-border, #374151);
}

.chat-input-wrapper {
  position: relative;
  border-radius: 0.5rem;
  overflow: hidden;
  box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06);
  border: 1px solid var(--surface-border, #e5e7eb);
  transition: all 0.2s ease;
}

.dark-theme .chat-input-wrapper {
  border-color: var(--surface-border, #374151);
  background-color: var(--surface-section, #283548);
}

.chat-input-wrapper:focus-within {
  box-shadow: 0 0 0 3px rgba(var(--primary-color-rgb, 79, 70, 229), 0.3);
  border-color: var(--primary-color, #4f46e5);
}

.chat-input {
  width: 100%;
  padding: 1rem 3rem 1rem 1rem;
  border: none;
  outline: none;
  resize: none;
  font-size: 1rem;
  line-height: 1.5;
  background-color: transparent;
  color: var(--text-color, inherit);
}

.dark-theme .chat-input {
  color: var(--text-color, #f9fafb);
}

.send-button, .stop-button {
  position: absolute;
  bottom: 0.75rem;
  right: 0.75rem;
  width: 2.25rem;
  height: 2.25rem;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.send-button {
  background-color: var(--primary-color, #4f46e5);
  color: var(--primary-color-text, white);
}

.send-button:hover {
  background-color: var(--primary-600, #4338ca);
}

.send-button:disabled {
  background-color: var(--primary-200, #c7d2fe);
  cursor: not-allowed;
}

.stop-button {
  background-color: var(--red-500, #ef4444);
  color: white;
}

.stop-button:hover {
  background-color: var(--red-600, #dc2626);
}

.input-help-text {
  margin-top: 0.5rem;
  font-size: 0.75rem;
  color: var(--text-secondary-color, #6b7280);
  text-align: center;
}

.dark-theme .input-help-text {
  color: var(--text-secondary-color, #9ca3af);
}

/* Typing indicator */
.typing-indicator {
  display: flex;
  gap: 0.25rem;
  padding: 0.5rem;
}

.dot-typing {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background-color: var(--primary-color, #4f46e5);
  display: inline-block;
  animation: dot-typing 1.5s infinite linear;
}

.animation-delay-200 {
  animation-delay: 0.2s;
}

.animation-delay-400 {
  animation-delay: 0.4s;
}

@keyframes dot-typing {
  0%, 100% {
    opacity: 0.3;
    transform: scale(0.8);
  }
  50% {
    opacity: 1;
    transform: scale(1);
  }
}

/* Responsive design */
@media (max-width: 768px) {
  .chat-layout {
    flex-direction: column;
  }
  
  .chat-sidebar {
    width: 100%;
    height: auto;
    max-height: 30vh;
    border-right: none;
    border-bottom: 1px solid var(--surface-border, #e5e7eb);
  }
  
  .message-container {
    max-width: 90%;
  }
}

/* Fix for the message content text color in dark mode */
.dark-theme .message-content {
  color: var(--text-color, #f9fafb);
}

/* Force high contrast on text elements */
.dark-theme .message-content,
.dark-theme .message-role,
.dark-theme .context-quotes-header,
.dark-theme .quote-text,
.dark-theme .quote-source {
  color: rgba(255, 255, 255, 0.95) !important;
}
</style> 