import type { LessonPlayerData } from './types';

const MOCK_LESSON: LessonPlayerData = {
    id: 'demo',
    title: 'Understanding Photosynthesis in Plants',
    subject: 'Photosynthesis',
    topic: 'Plants',
    recommendedMode: 'visual',
    reflection: {
        title: 'Still with us?',
        description: "Take your time — there's no rush. When you're ready, let us know where you are.",
        options: [
            { id: 'thinking', label: "I'm thinking it through" },
            { id: 'simpler', label: 'I need a simpler explanation' },
            { id: 'move-on', label: "I'd like to move on" },
        ],
    },
    reorientation: {
        title: "Let's try a completely different approach.",
        description: 'Sometimes a concept clicks better from a different angle. Here are some options.',
        options: [
            {
                id: 'action',
                title: 'Try the hands-on version',
                description: 'Work through this concept as a series of physical steps.',
                icon: 'hands',
            },
            {
                id: 'visual',
                title: 'See a visual diagram',
                description: 'Look at this concept through a diagram and visual explanation.',
                icon: 'image',
            },
            {
                id: 'skip',
                title: 'Skip for now and come back',
                description: 'Mark this concept for review later and continue the lesson.',
                icon: 'bookmark',
            },
        ],
        ctaLabel: 'Ask Nevo for help',
    },
    start: {
        eyebrow: 'Lesson',
        title: 'Understanding Photosynthesis in Plants',
        subtitle: 'From Ms. Bodeju',
        durationLabel: '12 minutes',
        conceptsLabel: '3 concepts',
        modeLabel: 'Best in visual',
        cards: {
            visual: {
                kind: 'image',
                title: 'Observe key structures first',
                detail: 'Start with a guided image walkthrough of the chloroplast.',
                imageUrl: '',
            },
            audio: {
                kind: 'audio',
                title: 'The concept in audio form',
                detail: 'Listen to the lesson introduction before the first stage.',
            },
            action: {
                kind: 'action',
                title: 'Move as you learn',
                detail: 'Use short physical prompts to model the process step by step.',
            },
            reading: {
                kind: 'reading',
                title: 'Key ideas in text',
                detail: 'Read the core concept first, then move into the lesson flow.',
            },
        },
        primaryCta: 'Begin lesson',
        secondaryCta: 'Or skip intro',
    },
    breakStates: {
        quick: {
            heading: "You've been learning for a while.",
            subheading: 'Take a quick reset.',
            durationLabel: 'Break for 1 min',
            primaryCta: "I'm ready to continue",
            secondaryCta: 'Take a longer break',
        },
        long: {
            heading: "You've been learning for a while.",
            subheading: 'Take a proper reset.',
            durationLabel: 'Break for 3 min',
            primaryCta: "I'm ready to continue",
            secondaryCta: 'Take a quick break',
        },
    },
    completion: {
        badgeLabel: 'Basic Science',
        heading: 'Understanding Photosynthesis in Plants',
        completedAtLabel: 'Completed March 15, 2024',
        metrics: [
            {
                value: '12',
                label: 'Concepts',
                description: '',
            },
            {
                value: '3',
                label: 'Clarity moments',
                description: '',
                accent: 'indigo',
            },
            {
                value: '2 of 3',
                label: 'Quiz answers',
                description: '',
            },
        ],
        conceptResults: [
            { label: 'Chloroplasts and their role', status: 'understood' },
            { label: 'The chemical equation', status: 'needed_more_time' },
            { label: 'Light and dark reactions', status: 'understood' },
            { label: 'Oxygen production process', status: 'simplified' },
            { label: 'Energy conversion process', status: 'understood' },
            { label: 'Carbon dioxide absorption', status: 'understood' },
            { label: 'Water molecule splitting', status: 'needed_more_time' },
            { label: 'ATP and NADPH formation', status: 'understood' },
            { label: 'Glucose synthesis', status: 'understood' },
            { label: 'Stomata function', status: 'understood' },
            { label: 'Chlorophyll absorption spectrum', status: 'understood' },
            { label: 'Calvin cycle steps', status: 'understood' },
        ],
        modeSummary: {
            title: 'You learned this in Visual mode.',
            description: 'Nevo delivered this lesson through visual explanations and diagrams.',
        },
        nextLesson: {
            id: 'water-cycle',
            title: 'The Water Cycle and Weather',
            subjectLabel: 'Basic Science',
            modeLabel: 'Reading mode',
            durationLabel: '20 min',
            ctaLabel: 'Start next lesson',
        },
        assessmentCtaLabel: 'Take assessment',
        browseCtaLabel: 'Back to lessons',
        closeLabel: 'Back to lessons',
    },
    assessment: {
        promptByVariant: {
            visual: 'Which process helps plants make their own food?',
            audio: 'Which process helps plants make their own food?',
            action: 'What would you do next to help a plant grow stronger?',
            reading: 'Which process helps plants make their own food?',
            kids: 'How do plants make food?',
        },
        helperLabelByVariant: {
            audio: 'Tap to replay',
            kids: 'Listen',
        },
        questionByVariant: {
            visual: {
                prompt: 'Which process helps plants make their own food?',
                correctOptionId: 'sunlight',
                explanation: 'Photosynthesis uses sunlight to help plants make their own food.',
                options: [
                    { id: 'sunlight', label: 'Sunlight work', icon: 'sun' },
                    { id: 'eating', label: 'Eating food', icon: 'leaf' },
                    { id: 'sleeping', label: 'Sleeping', icon: 'water' },
                    { id: 'drinking', label: 'Drinking water', icon: 'drop' },
                ],
            },
            audio: {
                prompt: 'Which process helps plants make their own food?',
                helperLabel: 'Tap to replay',
                correctOptionId: 'sunlight',
                explanation: 'Photosynthesis uses sunlight to help plants make their own food.',
                options: [
                    { id: 'sunlight', label: 'Sunlight work', icon: 'speaker' },
                    { id: 'eating', label: 'Eating food', icon: 'speaker' },
                    { id: 'sleeping', label: 'Sleeping', icon: 'speaker' },
                    { id: 'drinking', label: 'Drinking water', icon: 'speaker' },
                ],
            },
            action: {
                prompt: 'What would you do next to help a plant grow stronger?',
                correctOptionId: 'move-to-light',
                explanation: 'Moving the plant near sunlight gives it the light energy it needs for photosynthesis.',
                options: [
                    { id: 'move-to-light', label: 'Move it near sunlight', icon: 'seedling' },
                    { id: 'add-stickers', label: 'Add a wall sticker', icon: 'seedling' },
                    { id: 'cover-leaves', label: 'Cover the leaves', icon: 'seedling' },
                    { id: 'turn-off-light', label: 'Turn off the light and wait', icon: 'seedling' },
                ],
            },
            reading: {
                prompt: 'Which process helps plants make their own food?',
                correctOptionId: 'sunlight',
                explanation: 'Photosynthesis uses sunlight to help plants make their own food.',
                options: [
                    { id: 'sunlight', label: 'Sunlight work', icon: 'speaker' },
                    { id: 'eating', label: 'Eating food', icon: 'speaker' },
                    { id: 'sleeping', label: 'Sleeping', icon: 'speaker' },
                    { id: 'drinking', label: 'Drinking water', icon: 'speaker' },
                ],
            },
            kids: {
                prompt: 'How do plants make food?',
                helperLabel: 'Listen',
                correctOptionId: 'sunlight',
                explanation: 'Plants use sunlight to make food through photosynthesis.',
                options: [
                    { id: 'sunlight', label: 'Using sunlight', icon: 'sun', color: '#FDB022' },
                    { id: 'eating', label: 'Eating leaves', icon: 'leaf', color: '#7AB87A' },
                    { id: 'drinking', label: 'Drinking water', icon: 'drop', color: '#5B9BD5' },
                ],
            },
        },
        submitLabel: 'Check answer',
        helperText: 'Choose one answer to continue.',
        feedback: {
            correct: {
                heading: 'You got it.',
                description:
                    'The light-dependent reactions occur in the thylakoid membranes where chlorophyll molecules capture photon energy and convert it into chemical energy in the form of ATP and NADPH.',
                ctaLabel: 'Continue',
                footerLabel: 'Understood clearly',
            },
            incorrect: {
                heading: "Let's look at this another way.",
                description:
                    'Think of the chloroplast like a solar panel factory. The thylakoid membranes are the actual solar panels that convert light into usable energy, while the stroma is the assembly area where that energy becomes the construction of glucose molecules.',
                primaryCtaLabel: 'Try again',
                secondaryCtaLabel: 'Move on',
                footerLabel: 'You can always revisit this concept later.',
            },
            correction: {
                userAnswerLabel: 'Your answer',
                answerLabel: 'The answer',
                description:
                    'Chlorophyll is embedded specifically in the thylakoid membranes, not the stroma. The stroma is the fluid-filled space where the Calvin cycle occurs using the energy products from the light reactions.',
                ctaLabel: 'Continue',
            },
        },
    },
    microQuiz: [
        {
            prompt: 'Which gas do plants release during photosynthesis?',
            progressLabel: 'Question 1 of 3',
            progressPercent: 33.33,
            correctOptionId: 'oxygen',
            options: [
                { id: 'oxygen', label: 'Oxygen' },
                { id: 'carbon-dioxide', label: 'Carbon dioxide' },
                { id: 'nitrogen', label: 'Nitrogen' },
                { id: 'hydrogen', label: 'Hydrogen' },
            ],
            explanation: 'Plants release oxygen as a by-product after using light energy to convert water and carbon dioxide into glucose.',
            continueLabel: 'Next question',
            retryLabel: 'Try again',
            feedbackPrompts: [
                {
                    heading: 'This part can be tricky.',
                    description: 'Want to try a different explanation?',
                    primaryCtaLabel: "Yes, let's go",
                    secondaryCtaLabel: "I'm fine, keep going",
                },
                {
                    heading: "You've revisited this concept a few times.",
                    description: 'A simpler explanation might help.',
                    primaryCtaLabel: 'Show me a simpler version',
                    secondaryCtaLabel: 'I understand, continue',
                },
                {
                    heading: "Here's a clue.",
                    description: '',
                    primaryCtaLabel: 'Got it',
                    secondaryCtaLabel: 'I need a different answer',
                    hintLabel: 'The process occurs where the membrane and light meet directly.',
                },
            ],
        },
        {
            prompt: 'Which part of a plant captures most of the sunlight?',
            progressLabel: 'Question 2 of 3',
            progressPercent: 66.67,
            correctOptionId: 'leaves',
            options: [
                { id: 'roots', label: 'Roots' },
                { id: 'leaves', label: 'Leaves' },
                { id: 'stem', label: 'Stem' },
                { id: 'flowers', label: 'Flowers' },
            ],
            explanation: 'Leaves contain most of the chlorophyll, so they do the main light-catching work in photosynthesis.',
            continueLabel: 'Next question',
            retryLabel: 'Try again',
            feedbackPrompts: [
                {
                    heading: 'This part can be tricky.',
                    description: 'Want to try a different explanation?',
                    primaryCtaLabel: "Yes, let's go",
                    secondaryCtaLabel: "I'm fine, keep going",
                },
                {
                    heading: "You've revisited this concept a few times.",
                    description: 'A simpler explanation might help.',
                    primaryCtaLabel: 'Show me a simpler version',
                    secondaryCtaLabel: 'I understand, continue',
                },
                {
                    heading: "Here's a clue.",
                    description: '',
                    primaryCtaLabel: 'Got it',
                    secondaryCtaLabel: 'I need a different answer',
                    hintLabel: 'Think about the broad green surfaces that face the sun most directly.',
                },
            ],
        },
        {
            prompt: 'Why is sunlight important for plants?',
            progressLabel: 'Question 3 of 3',
            progressPercent: 100,
            correctOptionId: 'energy',
            options: [
                { id: 'decoration', label: 'It makes them look brighter' },
                { id: 'energy', label: 'It gives them energy' },
                { id: 'noise', label: 'It helps them make sound' },
                { id: 'speed', label: 'It makes roots move faster' },
            ],
            explanation: 'Sunlight provides the energy plants need to make glucose during photosynthesis.',
            continueLabel: 'Finish quiz',
            retryLabel: 'Try again',
            feedbackPrompts: [
                {
                    heading: 'This part can be tricky.',
                    description: 'Want to try a different explanation?',
                    primaryCtaLabel: "Yes, let's go",
                    secondaryCtaLabel: "I'm fine, keep going",
                },
                {
                    heading: "You've revisited this concept a few times.",
                    description: 'A simpler explanation might help.',
                    primaryCtaLabel: 'Show me a simpler version',
                    secondaryCtaLabel: 'I understand, continue',
                },
                {
                    heading: "Here's a clue.",
                    description: '',
                    primaryCtaLabel: 'Got it',
                    secondaryCtaLabel: 'I need a different answer',
                    hintLabel: 'Plants need sunlight because it powers the food-making process itself.',
                },
            ],
        },
    ],
    stages: [
        {
            key: 'observe',
            pillText: 'Observe',
            label: 'OBSERVE — WHAT DO YOU SEE?',
            labelSimplified: 'OBSERVE — INITIAL ANALYSIS',
            labelExpanded: 'OBSERVE — INITIAL ANALYSIS',
            modes: {
                visual: {
                    imageUrl: '',
                    body: "Notice the circular structure in the center with radiating blue arrows moving outward. Three distinct layers are visible—the innermost ring glows yellow, the middle band shows gradient transitions, and the outer edge fades into deep blue. Small white droplets appear suspended around the perimeter.",
                    bodySimplified: "Look at the green parts of the leaf. Tiny factories inside use sunlight to make food. They turn air and water into sugar.",
                    bodyExpanded: "Observe the intricate internal architecture of the chloroplast. The stacked thylakoid membranes—called grana—contain millions of chlorophyll molecules precisely arranged to capture photons across the visible spectrum. Each granum connects via stromal lamellae, creating an interconnected system where light-dependent reactions occur. The surrounding stroma houses enzymes for the Calvin cycle. This specialized organelle structure maximizes surface area for light absorption while organizing reaction sites for optimal efficiency.",
                },
                audio: {
                    audioUrl: '',
                    body: "Listen carefully to what I'm about to describe. You'll hear three distinct elements. Each one builds on the last. Pay attention to the order. Notice what comes first.",
                    bodySimplified: "Photosynthesis converts light into chemical energy. This happens in two distinct phases. Each phase has a specific job to do.",
                    bodyExpanded: "Listen as I walk you through the full mechanism. Light strikes chlorophyll molecules, exciting electrons into higher energy states. Those electrons travel through a transport chain, releasing energy used to split water molecules and produce ATP. Meanwhile, the Calvin cycle uses that ATP and CO₂ to build glucose. Two interlocking phases — light-dependent and light-independent — running continuously while sunlight is available.",
                },
                action: {
                    steps: [
                        { text: 'Place both hands flat on the table in front of you.', state: 'completed' },
                        { text: 'Look closely at the three objects lined up on the left. Notice their size and color.', state: 'completed' },
                        { text: 'Pick up the first object. Feel its weight in your hand.', state: 'completed' },
                        { text: 'Set it down. Count to three slowly while watching it.', state: 'active' },
                    ],
                    stepsSimplified: [
                        { text: 'Imagine cupping your hands to form a bowl shape.', state: 'completed' },
                        { text: 'Now slowly tilt the imaginary bowl toward the light source.', state: 'active' },
                    ],
                    stepsExpanded: [
                        { text: 'Hold a tennis ball or similar spherical object. Feel its three-dimensional form—this represents Earth receiving sunlight from all directions simultaneously.', state: 'completed' },
                        { text: 'Place the ball under a desk lamp. Notice how only the illuminated hemisphere receives direct light energy—this models how only the sun-facing side of a leaf actively photosynthesizes at peak efficiency.', state: 'completed' },
                        { text: 'Slowly rotate the ball under the lamp. Observe how different surface areas move through maximum illumination—analogous to how leaves track sunlight throughout the day via heliotropism.', state: 'completed' },
                        { text: 'Move the ball closer to the light source, then farther away. Feel the intensity difference—this demonstrates the inverse square law affecting light-dependent reactions.', state: 'active' },
                        { text: 'Cover half the ball with your hand while keeping it illuminated. The shadowed portion receives no light—modeling how limiting factors affect only constrained regions, while optimal conditions persist elsewhere.', state: 'unread' },
                        { text: 'Place multiple small objects around the ball, casting shadows. These obstructions represent competing plants, cloud cover, or canopy layers—all factors affecting light availability in natural ecosystems.', state: 'unread' },
                    ],
                },
                reading: {
                    keyTermLabel: 'OBSERVE — INITIAL ANALYSIS',
                    keyTerm: 'Photosynthesis',
                    definition:
                        'Photosynthesis is the biochemical process by which autotrophic organisms convert light energy into chemical energy stored in glucose molecules. The process occurs primarily in chloroplasts, specialized organelles containing chlorophyll pigments that absorb specific wavelengths of light. During photosynthesis, carbon dioxide and water are transformed into glucose and oxygen through light-dependent and light-independent reactions. This foundational metabolic pathway sustains nearly all life on Earth by producing organic compounds and atmospheric oxygen.',
                    definitionSimplified:
                        'The thylakoid membrane contains stacks of disc-shaped structures called grana. Each granum is where light energy gets captured. Chlorophyll molecules embedded here appear bright green.',
                    definitionExpanded:
                        'Photosynthesis is the biochemical process by which autotrophic organisms convert light energy into chemical energy stored in glucose molecules. The process occurs primarily in chloroplasts, specialized organelles containing chlorophyll pigments that absorb specific wavelengths of light across the visible spectrum (excluding green, which is reflected). During photosynthesis, carbon dioxide and water are transformed into glucose and oxygen through coupled light-dependent and light-independent reactions, with the Calvin cycle fixing CO₂ into G3P intermediates that polymerize into glucose. This foundational metabolic pathway sustains nearly all life on Earth by producing organic compounds and atmospheric oxygen, and underpins both food chains and the global carbon cycle.',
                    formula: '6CO₂ + 6H₂O + light energy → C₆H₁₂O₆ + 6O₂',
                    formulaExpanded: '6CO₂ + 6H₂O + light energy → C₆H₁₂O₆ + 6O₂\nΔG° = +2870 kJ/mol (endergonic, light-driven)',
                },
            },
            slowerSteps: [
                { stepNumber: 1, text: 'The thylakoid membrane appears as a flattened sac. Green chlorophyll molecules are embedded within it.', ttsText: 'The thylakoid membrane appears as a flattened sac.' },
                { stepNumber: 2, text: 'Look closely. Notice how light hits the surface first.', ttsText: 'Look closely. Notice how light hits the surface first.' },
                { stepNumber: 3, text: 'Energy begins to move through the membrane.', ttsText: 'Energy begins to move through the membrane.', isLastStep: true },
            ],
        },
        {
            key: 'notice',
            pillText: 'Notice Change',
            label: 'NOTICE — WHAT IS DIFFERENT?',
            labelSimplified: 'NOTICE CHANGE — IDENTIFYING VARIATION',
            labelExpanded: 'NOTICE CHANGE — IDENTIFYING VARIATION',
            modes: {
                visual: {
                    imageUrl: '',
                    body: "Look closely at the middle band where colors shift from yellow to blue. This transition zone wasn't static in the previous view—it's now showing movement indicators. Three small arrows have appeared pointing clockwise, and the gradient has intensified. The change happens right where the two states meet.",
                    bodySimplified: 'A limiting factor stops a process. If plants have light but no air, they cannot grow. The missing part limits everything.',
                    bodyExpanded:
                        "Think about limiting factors as biological bottlenecks—they're the constraints that determine reaction rates regardless of other abundant resources. Imagine photosynthesis as a factory assembly line. If you have brilliant sunshine and plenty of water but minimal carbon dioxide, the entire process stalls at CO₂ fixation. The light energy goes unused because the Calvin cycle lacks raw materials. Temperature also plays a critical role—enzymes denature above optimal ranges, while low temperatures slow molecular collisions. Blackman's law of limiting factors, established in 1905, explains why greenhouses carefully control multiple environmental variables simultaneously. It's not just about providing more of everything—it's about identifying and addressing the specific constraint that limits growth at any given moment.",
                    highlight: { x: 50, y: 50, size: 192 },
                },
                audio: {
                    audioUrl: '',
                    body: "Something has shifted here. Can you hear the difference? The middle section now has movement. Three new elements appeared. This is where the change happens.",
                    bodySimplified: 'Light intensity affects the reaction speed.',
                    bodyExpanded: 'Listen carefully. Light intensity directly affects reaction speed. As photons increase, more electrons get excited per second, accelerating ATP production. But this only works up to a saturation point—once chlorophyll molecules are fully engaged, additional light has no effect. The limiting factor shifts from light to either carbon dioxide concentration or enzyme capacity. Notice the trade-off as the mechanism approaches its ceiling.',
                },
                action: {
                    steps: [
                        { text: 'Look at the middle object again. Does it appear the same?', state: 'completed' },
                        { text: 'Touch the surface. Run your finger across the top edge.', state: 'completed' },
                        { text: 'Now compare it to the object on the right. What changed?', state: 'active' },
                        { text: 'Write down one specific difference you noticed.', state: 'unread' },
                    ],
                    stepsSimplified: [
                        { text: 'Compare the two leaves. Notice the colour difference.', state: 'completed' },
                        { text: 'Press gently on each. Feel which one is firmer.', state: 'active' },
                    ],
                    stepsExpanded: [
                        { text: 'Examine both samples under controlled lighting. Note hue, saturation, and surface texture variations.', state: 'completed' },
                        { text: 'Apply consistent pressure to each. Measure firmness as a proxy for cellular turgor and structural integrity.', state: 'completed' },
                        { text: 'Document at least three measurable variations between samples.', state: 'active' },
                        { text: 'Hypothesize which environmental variable—water, light, or nutrients—most likely caused the divergence.', state: 'unread' },
                    ],
                },
                reading: {
                    keyTermLabel: 'NOTICE CHANGE — IDENTIFYING VARIATION',
                    keyTerm: 'Limiting Factor',
                    definition:
                        'A limiting factor is any environmental variable that constrains the rate of a biological process when present below optimal levels. In photosynthesis, common limiting factors include light intensity, carbon dioxide concentration, and temperature. When a limiting factor is in short supply, increasing other variables will not enhance the reaction rate.',
                    definitionSimplified:
                        'A limiting factor stops a process. If plants have light but no air, they cannot grow. The missing part limits everything.',
                    definitionExpanded:
                        "Think about limiting factors as biological bottlenecks—they're the constraints that determine reaction rates regardless of other abundant resources. Imagine photosynthesis as a factory assembly line. If you have brilliant sunshine and plenty of water but minimal carbon dioxide, the entire process stalls at CO₂ fixation. The light energy goes unused because the Calvin cycle lacks raw materials. Temperature also plays a critical role—enzymes denature above optimal ranges, while low temperatures slow molecular collisions. Blackman's law of limiting factors, established in 1905, explains why greenhouses carefully control multiple environmental variables simultaneously. It's not just about providing more of everything—it's about identifying and addressing the specific constraint that limits growth at any given moment.",
                    formula: 'Rate of photosynthesis = f(min([light, CO₂, temperature, water]))',
                },
            },
            slowerSteps: [
                { stepNumber: 1, text: 'Light intensity affects the reaction speed.', ttsText: 'Light intensity affects the reaction speed.' },
                { stepNumber: 2, text: 'Watch what happens as we add more light gradually.', ttsText: 'Watch what happens as we add more light gradually.' },
                { stepNumber: 3, text: 'Notice the rate increases — but only up to a point.', ttsText: 'Notice the rate increases — but only up to a point.', isLastStep: true },
            ],
        },
        {
            key: 'relate',
            pillText: 'Relate',
            label: 'RELATE — WHERE HAVE YOU SEEN THIS?',
            labelSimplified: 'PRACTICE — TRY IT YOURSELF',
            labelExpanded: 'RELATE — CONNECT IT',
            modes: {
                visual: {
                    imageUrl: '',
                    body: 'This circular motion appears everywhere in your daily life. Think about stirring your morning drink—the liquid spirals outward from the center, just like these arrows. Or watch water drain from a sink, creating the same rotating pattern. The playground roundabout moves in this exact circular flow.',
                    bodySimplified: 'Imagine cupping your hands to form a bowl shape, then slowly tilt the imaginary bowl toward the light source.',
                    bodyExpanded: "You've seen this pattern in the water cycle (evaporation → condensation → precipitation → runoff), in respiration (inhale → exhale), and in seasonal cycles (spring → summer → autumn → winter). The circular flow is one of nature's defining patterns — anywhere matter or energy must conserve and return to a starting state, you'll find it.",
                },
                audio: {
                    audioUrl: '',
                    body: "You've seen this pattern before. Think about stirring your morning coffee. The liquid spirals outward from the center. Or watch water drain from your sink. That same circular motion is happening here.",
                    bodySimplified: 'Listen and place yourself there. You stir coffee, the water swirls.',
                    bodyExpanded: "Pause and connect this to lived experience. The hurricane spinning across the Atlantic, the wheel of a bicycle in motion, the hands of a clock circling the dial — all express the same underlying circular pattern. As you listen, notice how widely the structure recurs. That recurrence is the clue: when you see it, you're looking at conserved motion or energy returning to its origin.",
                },
                action: {
                    steps: [
                        { text: 'Think of something round you use every morning. Pick it up if it’s nearby.', state: 'completed' },
                        { text: 'Hold it the same way you held the first object. Feel the similarity.', state: 'completed' },
                        { text: 'Say out loud: “This is like ___ because ___.” Fill in the blanks.', state: 'active' },
                    ],
                    stepsSimplified: [
                        { text: 'Pick up something round.', state: 'completed' },
                        { text: 'Feel its shape with both hands.', state: 'active' },
                    ],
                    stepsExpanded: [
                        { text: 'Hold a tennis ball or similar spherical object. Feel its three-dimensional form—this represents Earth receiving sunlight from all directions simultaneously.', state: 'completed' },
                        { text: 'Place the ball under a desk lamp. Notice how only the illuminated hemisphere receives direct light energy—this models how only the sun-facing side of a leaf actively photosynthesizes at peak efficiency.', state: 'completed' },
                        { text: 'Slowly rotate the ball under the lamp. Observe how different surface areas move through maximum illumination—analogous to how leaves track sunlight throughout the day via heliotropism.', state: 'active' },
                        { text: 'Move the ball closer to the light source, then farther away. Feel the intensity difference—this demonstrates the inverse square law affecting light-dependent reactions.', state: 'unread' },
                        { text: 'Cover half the ball with your hand while keeping it illuminated. The shadowed portion receives no light—modeling how limiting factors affect only constrained regions, while optimal conditions persist elsewhere.', state: 'unread' },
                        { text: 'Place multiple small objects around the ball, casting shadows. These obstructions represent competing plants, cloud cover, or canopy layers—all factors affecting light availability in natural ecosystems.', state: 'unread' },
                    ],
                },
                reading: {
                    keyTermLabel: 'RELATE — CONNECT IT',
                    keyTerm: 'Carbon Fixation',
                    definition:
                        'Carbon fixation refers to the conversion of inorganic carbon dioxide into organic compounds during the Calvin cycle. This process occurs in the stroma of chloroplasts.',
                    definitionSimplified: 'A limiting factor stops a process. If plants have light but no air, they cannot grow. The missing part limits everything.',
                    definitionExpanded: 'Carbon fixation refers to the conversion of inorganic carbon dioxide into organic compounds during the Calvin cycle. This process occurs in the stroma of chloroplasts and does not directly require light, though it depends on ATP and NADPH produced during light-dependent reactions. Agricultural productivity worldwide depends on efficient carbon fixation—crops like wheat, rice, and maize use the C3 pathway, while plants adapted to hot, arid climates employ C4 or CAM pathways to minimize photorespiration. Understanding carbon fixation mechanisms is critical for developing climate-resilient crops and predicting ecosystem responses to rising atmospheric CO₂ levels.',
                },
            },
            slowerSteps: [
                { stepNumber: 1, text: 'Hold up your hand and form a circle with your fingers.', ttsText: 'Hold up your hand and form a circle with your fingers.' },
                { stepNumber: 2, text: 'Slowly trace the inside edge with your other index finger.', ttsText: 'Slowly trace the inside edge with your other index finger.' },
                { stepNumber: 3, text: 'Rotate your wrist slowly clockwise.', ttsText: 'Rotate your wrist slowly clockwise.' },
                { stepNumber: 4, text: 'Notice you have just modeled the same circular flow.', ttsText: 'Notice you have just modeled the same circular flow.' },
                { stepNumber: 5, text: 'Reverse direction. The pattern still works.', ttsText: 'Reverse direction. The pattern still works.' },
                { stepNumber: 6, text: 'You can find this pattern almost anywhere.', ttsText: 'You can find this pattern almost anywhere.', isLastStep: true },
            ],
        },
        {
            key: 'predict',
            pillText: 'Predict',
            label: 'PREDICT — WHAT HAPPENS NEXT?',
            labelSimplified: 'ANALYSIS — KEY CONCEPT',
            labelExpanded: 'PREDICT — HYPOTHESIZE',
            modes: {
                visual: {
                    imageUrl: '',
                    body: "Based on the circular pattern and the arrows' direction, what do you think happens when the blue reaches the outer edge? Will it continue outward infinitely, or loop back to the yellow center? Look at the empty space on the right side—imagine what might fill it as the cycle continues.",
                    bodySimplified: "Every enzyme has a maximum processing speed. When light exceeds this capacity, the reaction rate stops increasing. This ceiling is called the saturation point.",
                    bodyExpanded: "Based on the circular pattern, the arrows' direction, and what you know about conservation, predict precisely what occurs at the outer edge. Will the system maintain its angular momentum? Will energy dissipate via friction-equivalent losses? Form a falsifiable hypothesis: 'When the blue reaches the edge, X will happen because Y.' Then identify what observation would confirm or rule out your prediction.",
                },
                audio: {
                    audioUrl: '',
                    body: 'What do you think happens next? Will it continue outward forever? Or does it loop back to the start? Picture the empty space on the right. Imagine what fills it as the cycle continues.',
                    bodySimplified: 'When light exceeds enzyme capacity, additional photons produce no extra output.',
                    bodyExpanded: 'Predict, with reasoning. Listen to the constraints: enzyme capacity is finite, photon supply can exceed demand, and energy that cannot be converted dissipates as heat. Now describe what you expect at the saturation threshold and just past it. Speak your prediction aloud — that act commits you to it and makes the eventual confirmation or refutation matter.',
                },
                action: {
                    steps: [
                        { text: 'Look at the empty space to the right of the three objects.', state: 'completed' },
                        { text: 'Point to where you think the pattern continues. Trace the path with your finger.', state: 'completed' },
                        { text: 'Tap the table twice where the next object should appear.', state: 'active' },
                    ],
                    stepsSimplified: [
                        { text: 'Predict where the next object will be. Point to it.', state: 'active' },
                    ],
                    stepsExpanded: [
                        { text: 'Look at the empty space to the right of the three objects. Note distance and angular spacing of the existing pattern.', state: 'completed' },
                        { text: 'Calculate where a continuation would land if the spacing pattern holds.', state: 'completed' },
                        { text: 'Mark the predicted spot with a finger. State out loud why you chose that location.', state: 'active' },
                        { text: 'Now consider: what could make your prediction wrong? Note one alternative outcome.', state: 'unread' },
                    ],
                },
                reading: {
                    keyTermLabel: 'PREDICT — HYPOTHESIZE',
                    keyTerm: 'Light Saturation Point',
                    definition: 'More light usually means faster photosynthesis. But after a certain point, extra light does not help. This maximum is the saturation point.',
                    definitionSimplified: 'Every enzyme has a maximum processing speed. When light exceeds this capacity, the reaction rate stops increasing. This ceiling is called the saturation point.',
                    definitionExpanded:
                        'Based on established principles of limiting factors and the mechanistic understanding of photosynthetic pathways, we can formulate precise hypotheses regarding light saturation points across different plant species. At low photon flux densities, photosynthetic rate exhibits linear correlation with light intensity—the light-dependent reactions in thylakoid membranes operate below capacity, and increasing illumination directly enhances ATP and NADPH production for the Calvin cycle. However, once light intensity escalates, the system approaches enzymatic limitations. RuBisCO, the carbon-fixing enzyme central to the stroma, possesses a maximum catalytic rate. Even with abundant light energy converted to chemical intermediates, the dark reactions cannot process carbon dioxide faster than enzyme kinetics permit. We therefore predict species-specific saturation points: C3 plants adapted to temperate climates likely saturate around 800-1000 µmol photons/m² at 25°C with optimal CO₂, while shade-tolerant understory species saturate at significantly lower intensities due to fewer chloroplasts per mesophyll cell and reduced enzyme concentrations evolved for low-light environments.',
                    formula: 'If Light > Saturation Point: Rate(photosynthesis) = constant (plateau phase)',
                    formulaExpanded: 'Rate = Vmax × [Light] / (Km + [Light])\nWhere: Vmax = maximum rate at saturation\nKm = light intensity at half-maximal rate\nAt Light >> Km: Rate asymptotically approaches Vmax',
                },
            },
            slowerSteps: [
                { stepNumber: 1, text: 'Stop and think. The arrows are pointing outward.', ttsText: 'Stop and think. The arrows are pointing outward.' },
                { stepNumber: 2, text: 'When light exceeds enzyme capacity, additional photons produce no extra output.', ttsText: 'When light exceeds enzyme capacity, additional photons produce no extra output.' },
                { stepNumber: 3, text: 'Rate plateaus at saturation point regardless of further light increase.', ttsText: 'Rate plateaus at saturation point regardless of further light increase.', isLastStep: true },
            ],
        },
        {
            key: 'confirm',
            pillText: 'Confirm',
            label: 'CONFIRM — WHAT DID YOU LEARN?',
            labelSimplified: 'CONFIRM — KEY CONCEPT',
            labelExpanded: 'CONFIRM — VERIFY',
            modes: {
                visual: {
                    imageUrl: '',
                    body: "The pattern creates a continuous cycle—the blue arrows return to the yellow center, completing the loop. This circular flow represents how cycles work in nature and systems. What moves outward must eventually return, creating endless repetition. You've now observed, tracked changes, connected it to life, predicted the outcome, and confirmed the pattern.",
                    bodySimplified: "Light starts the cycle. The cycle returns to itself. That's the pattern.",
                    bodyExpanded: "The pattern creates a continuous cycle. You have now formally verified — through observation, change-tracking, lived analogy, and prediction — that circular flows recur across scales: from chloroplast electron transport to planetary cycles. This is not coincidence. It reflects conservation laws acting on bounded systems. What moves outward must eventually return. You can now apply this lens to any new system you encounter.",
                    marker: { x: 50, y: 50, label: 'Cycle Completion Point' },
                },
                audio: {
                    audioUrl: '',
                    body: "Here's what you discovered. The pattern creates a continuous loop. What moves outward must return. You observed, tracked changes, connected it to your life, predicted, and confirmed. You've completed the full cycle.",
                    bodySimplified: "You followed the cycle. It returned to itself. You see the pattern now.",
                    bodyExpanded: "Here's what you discovered, in full. The system you tracked obeys conservation: energy or matter cycling rather than disappearing. You verified this by observation, by spotting variation, by connecting to lived analogies, and by predicting before being told. Now confirm aloud: what is the rule? When does it apply? When does it break? Owning the answer is the difference between knowing and being able to use what you know.",
                },
                action: {
                    steps: [
                        { text: 'Check the final position. Was your prediction correct?', state: 'completed' },
                        { text: 'Pick up all three objects one more time in order.', state: 'completed' },
                        { text: 'You observed, spotted change, connected, predicted, and confirmed.', state: 'completed' },
                    ],
                    stepsSimplified: [
                        { text: 'Place the objects in order. Check the cycle completes.', state: 'completed' },
                    ],
                    stepsExpanded: [
                        { text: 'Verify the final position against your earlier prediction. Note where you were right and where you were off.', state: 'completed' },
                        { text: 'Repeat the sequence to test reproducibility.', state: 'completed' },
                        { text: 'Articulate the underlying rule in one sentence.', state: 'completed' },
                        { text: 'Identify a different system where the same rule should hold.', state: 'completed' },
                    ],
                },
                reading: {
                    keyTermLabel: 'CONFIRM — VERIFY',
                    keyTerm: 'Quantum Yield',
                    definition: "Quantum yield measures photosynthetic efficiency: how many CO₂ molecules are fixed per photon absorbed.",
                    definitionSimplified: 'You confirmed it. Light starts the cycle. The cycle returns. Photosynthesis follows the same rule.',
                    definitionExpanded:
                        'The concept of quantum yield confirms our understanding of photosynthetic efficiency—it measures the number of CO₂ molecules fixed per photon absorbed. Empirical data verify that photosynthesis operates as a biochemical process constrained by limiting factors, with light intensity, carbon dioxide concentration, and temperature all influencing the rate of carbon fixation. The light saturation point exists because, beyond optimal intensity, the Calvin-cycle enzymes and electron transport chains reach maximum capacity. Photosynthesis thus demonstrates how autotrophic organisms convert light energy into chemical energy through precisely regulated pathways, sustaining life by producing glucose and oxygen while responding dynamically to environmental variables.',
                    formula: 'Quantum Yield (Φ) = mol CO₂ fixed / mol photons absorbed',
                    formulaExpanded: 'Quantum Yield (Φ) = mol CO₂ fixed / mol photons absorbed\nTypical maximum: Φ ≈ 0.125 (8 photons per CO₂)',
                },
            },
            slowerSteps: [
                { stepNumber: 1, text: "Light starts the cycle.", ttsText: 'Light starts the cycle.' },
                { stepNumber: 2, text: 'The cycle returns to itself.', ttsText: 'The cycle returns to itself.' },
                { stepNumber: 3, text: "That's the pattern. You confirmed it.", ttsText: "That's the pattern. You confirmed it.", isLastStep: true },
            ],
        },
    ],
};

const sleep = (ms: number) => new Promise((res) => setTimeout(res, ms));

export async function getLessonPlayer(_lessonId: string): Promise<LessonPlayerData> {
    await sleep(150);
    return MOCK_LESSON;
}
