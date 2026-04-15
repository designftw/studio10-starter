import { createApp, ref, computed } from "vue";
import { GraffitiLocal } from "@graffiti-garden/implementation-local";
import { GraffitiDecentralized } from "@graffiti-garden/implementation-decentralized";
import {
  GraffitiPlugin,
  useGraffiti,
  useGraffitiSession,
  useGraffitiDiscover,
} from "@graffiti-garden/wrapper-vue";

function setup() {
  // Initialize Graffiti
  const graffiti = useGraffiti();
  const session = useGraffitiSession();

  // This is the "directory" our messages will go in
  const channel = "designftw-26";

  // Declare a signal for the message entered in the chat
  const myMessage = ref("");

  // "Discover" messages in the chat
  const { objects: messageObjects, isFirstPoll: areMessageObjectsLoading } =
    useGraffitiDiscover(
      [channel],
      {
        value: {
          required: ["content", "published"],
          properties: {
            content: { type: "string" },
            published: { type: "number" },
          },
        },
      },
      undefined, // Don't look for private messages
      true, // Automatically poll for new messages (realtime)
    );

  // Sort the messages by their timestamp
  const sortedMessageObjects = computed(() => {
    return messageObjects.value.toSorted((a, b) => {
      return b.value.published - a.value.published;
    });
  });

  // A function to send a message.
  // Since the function is async, we
  // create an "isSending" signal for
  // displaying feedback.
  const isSending = ref(false);
  async function sendMessage() {
    isSending.value = true;
    try {
      await graffiti.post(
        {
          value: {
            content: myMessage.value,
            published: Date.now(),
          },
          channels: [channel],
        },
        session.value,
      );
      myMessage.value = "";
    } finally {
      isSending.value = false;
    }
  }

  // A function to delete a message.
  // Since the function is async, we
  // create an "isDeleting" signal for
  // displaying feedback.
  const isDeleting = ref(new Set());
  async function deleteMessage(message) {
    isDeleting.value.add(message.url);
    try {
      await graffiti.delete(message, session.value);
    } finally {
      isDeleting.value.delete(message.url);
    }
  }

  return {
    myMessage,
    messageObjects,
    areMessageObjectsLoading,
    sortedMessageObjects,
    isSending,
    sendMessage,
    isDeleting,
    deleteMessage,
  };
}

const App = { template: "#template", setup };

createApp(App)
  .use(GraffitiPlugin, {
    // graffiti: new GraffitiLocal(),
    graffiti: new GraffitiDecentralized(),
  })
  .mount("#app");
