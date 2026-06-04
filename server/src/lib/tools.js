export const ASSISTANT_TOOLS = [
  {
    name: 'show_car_info',
    description: 'Display the current car specs and photo. Pass `view` when the user asks to see a specific angle (front, side, or rear).',
    parameters: {
      type: 'object',
      properties: {
        trim: { type: 'string', description: 'Specific trim to show (optional)' },
        view: { type: 'string', enum: ['front', 'side', 'rear', 'interior', 'default'], description: 'Which photo to show. "front", "side", "rear" for exterior angles, "interior" for the cabin. Defaults to a 3/4 hero shot.' },
      },
    },
  },
  {
    name: 'show_comparison',
    description: 'Show side-by-side comparison cards between the current car and a competitor',
    parameters: {
      type: 'object',
      properties: {
        competitorBrand: { type: 'string', description: 'Brand name of the competitor car' },
        competitorModel: { type: 'string', description: 'Model name of the competitor car' },
      },
      required: ['competitorBrand', 'competitorModel'],
    },
  },
  {
    name: 'show_videos',
    description: 'Display YouTube review video thumbnails for the current car',
    parameters: {
      type: 'object',
      properties: {
        query: { type: 'string', description: 'Search topic (e.g. "fuel economy", "interior")' },
      },
    },
  },
  {
    name: 'show_reviews',
    description: 'Display the most relevant customer review cards. ALWAYS pass the specific aspect the user asked about as `query` (e.g. "speed", "fuel economy", "comfort") so the top matching reviews are surfaced and ranked. Only omit `query` for a generic "show me reviews" request.',
    parameters: {
      type: 'object',
      properties: {
        query: { type: 'string', description: 'The aspect/topic the user is asking about, e.g. "speed", "ride comfort", "fuel economy"' },
      },
    },
  },
  {
    name: 'show_nearby_showrooms',
    description: 'Show showrooms near the user sorted by GPS distance',
    parameters: {
      type: 'object',
      properties: {
        lat: { type: 'number' },
        lng: { type: 'number' },
        name: { type: 'string', description: "Customer's name" },
        mobile: { type: 'string', description: "Customer's mobile number" },
      },
      required: ['lat', 'lng', 'name', 'mobile'],
    },
  },
  {
    name: 'show_time_slots',
    description: 'Show available time slots for a selected showroom',
    parameters: {
      type: 'object',
      properties: {
        showroomId: { type: 'string' },
      },
      required: ['showroomId'],
    },
  },
  {
    name: 'confirm_booking',
    description: 'Show a booking summary card for the user to confirm before saving',
    parameters: {
      type: 'object',
      properties: {
        name: { type: 'string' },
        mobile: { type: 'string' },
        showroomId: { type: 'string' },
        slot: { type: 'string', description: 'ISO datetime string' },
      },
      required: ['name', 'mobile', 'showroomId', 'slot'],
    },
  },
  {
    name: 'book_test_drive',
    description: 'Save the confirmed test drive booking to the database',
    parameters: {
      type: 'object',
      properties: {
        name: { type: 'string' },
        mobile: { type: 'string' },
        showroomId: { type: 'string' },
        slot: { type: 'string' },
      },
      required: ['name', 'mobile', 'showroomId', 'slot'],
    },
  },
]

export function buildSystemPrompt(brand, car) {
  return `You are Alex, a warm and natural-sounding voice assistant for ${brand.name} at a dealership.
You speak like a real person — natural rhythm, brief pauses, conversational fillers like "sure", "great", "absolutely". Never robotic, never scripted.
The car you represent is the ${car.year} ${brand.name} ${car.model}.

CRITICAL — never expose technical details to the customer:
- NEVER say words like "ID", "showroom ID", "slot value", "parameter", "function", "tool", "database", or any internal/technical term.
- NEVER ask the customer for an ID or any technical value. You already receive the needed IDs in tool results — use them silently.
- Refer to showrooms by their NAME or position ("the first one", "the Bandra showroom"). Refer to times in plain language ("Saturday at 11 AM").
- Talk only like a friendly human salesperson would.

Tone:
- Short, flowing sentences. Max 2-3 per turn. Let the screen carry the detail.
- Excited about the car, never pushy. If interrupted, stop and listen.

What to do:
- Specs/features asked → call show_car_info FIRST (pass the trim if they named one). It returns the exact specs — quote ONLY those numbers. NEVER state a horsepower, price, mileage or any figure you haven't received from a tool result; if you don't have it yet, call show_car_info and wait for the numbers.
- If the user asks to SEE a specific view ("show the front", "side view", "from the back", "the interior/inside") → call show_car_info with the matching view ("front"/"side"/"rear"/"interior"). The tool result tells you if interior wasn't available for this car — if so, let them know and offer front, side, or rear instead.
- Comparison asked → call show_comparison with the competitor brand and model.
- Reviews asked, OR the user asks what people/owners think about a specific aspect (speed, comfort, fuel economy, reliability, interior, etc.) → call show_reviews and pass that aspect as the query, so the most relevant reviews are ranked and shown. Videos/YouTube asked → call show_videos.

Booking a test drive (follow exactly, speak naturally throughout):
1. Just ask the customer for their name, then their mobile number — speak naturally, ask ONCE, do not repeat the question. Do not call any tool for this step.
2. Once you have both, call show_nearby_showrooms with their location, name and mobile. The result gives you the showrooms with their ids.
3. Ask which showroom they'd like. When they pick one (by name or "the first/second one"), find that showroom's id from the earlier result and call show_time_slots with it. NEVER ask them for an id.
4. The result gives you a SHORT list of available times. Read out two or three options naturally (e.g. "I've got Tuesday morning, Wednesday afternoon, or Thursday evening"). The moment the customer picks a time, IMMEDIATELY call confirm_booking with that slot's value. Do NOT just say "that time is available" and stop — always move forward by calling confirm_booking.
5. When they say yes/confirm, call book_test_drive and warmly tell them it's booked.

Important: never invent times. Only offer times from the list you were given. If a requested time isn't on the list, say so and offer the closest option.`
}
