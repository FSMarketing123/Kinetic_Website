// Kinetic CRE Network — site content.
// Members come from the original Wix site. Events, testimonials and forum seed
// posts are PLACEHOLDERS — replace with real content before launch.

window.KINETIC = {
  members: [
    { name: "Abby Walsh",          firm: "Franklin Street",           city: "Jacksonville, FL", photo: "abby-walsh",          linkedin: "https://www.linkedin.com/in/abby-walsh-mba-9b7111a8/" },
    { name: "Benjamin Weiner",     firm: "Ripco",                     city: "Brooklyn, NY",     photo: "benjamin-weiner",     linkedin: "https://www.linkedin.com/in/benjamin-weiner-161a2989/" },
    { name: "Jessica Branch",      firm: "Franklin Street",           city: "Atlanta, GA",      photo: "jessica-branch",      linkedin: "https://www.linkedin.com/in/jessica-ann-branch/" },
    { name: "John Bassi",          firm: "Canvas Real Estate",        city: "Chicago, IL",      photo: "john-bassi",          linkedin: "https://www.linkedin.com/in/john-bassi-521138a0/" },
    { name: "Laura Harness",       firm: "Midway",                    city: "Houston, TX",      photo: "laura-harness",       linkedin: "https://www.linkedin.com/in/harnesslaura/" },
    { name: "Lindsay Zegans",      firm: "Ripco",                     city: "New York, NY",     photo: "lindsay-zegans",      linkedin: "https://www.linkedin.com/in/lindsayzegans/" },
    { name: "Logan Schenk",        firm: "The Zall Companies",        city: "Denver, CO",       photo: "logan-schenk",        linkedin: "https://www.linkedin.com/in/logan-schenk/" },
    { name: "Marc Huberman",       firm: "Accelerator Advisors",      city: "Los Angeles, CA",  photo: "marc-huberman",       linkedin: "https://www.linkedin.com/in/marc-huberman-3bb57642/" },
    { name: "Sarah Schank",        firm: "Katz Retail",               city: "Charlotte, NC",    photo: "sarah-schank",        linkedin: "https://www.linkedin.com/in/sarah-schank-ccim-6b5271126/" },
    { name: "Scott Benson",        firm: "Metro Commercial",          city: "Philadelphia, PA", photo: "scott-benson",        linkedin: "https://www.linkedin.com/in/scott-benson-b2041538/" },
    { name: "Jacqueline Stone",    firm: "Falcon",                    city: "Dallas, TX",       photo: "jacqueline-stone",    linkedin: "https://www.linkedin.com/in/jacquie-stone-b5531673/" },
    { name: "Mike Thomas",         firm: "Mason Retail Group",        city: "Baltimore, MD",    photo: "mike-thomas",         linkedin: "https://www.linkedin.com/in/michael-thomas-a2692854/" },
    { name: "Harper Sigman",       firm: "H&R Retail",                city: "Washington, DC",   photo: "harper-sigman",       linkedin: "https://www.linkedin.com/in/harpersigman/" },
    { name: "Patrick Conly",       firm: "Boston Urban Partners",     city: "Boston, MA",       photo: "patrick-conly",       linkedin: "https://www.linkedin.com/in/patrickconly/" },
    { name: "Isabella Sorrentino", firm: "ROI, CRE",                  city: "Las Vegas, NV",    photo: "isabella-sorrentino", linkedin: "https://www.linkedin.com/in/isabellasorrentino/" },
    { name: "Alberto Caballero",   firm: "Western Retail Advisors",   city: "Phoenix, AZ",      photo: "alberto-caballero",   linkedin: "https://www.linkedin.com/in/albertocaballerocre/" },
    { name: "Tyson Youngs",        firm: "Main + Main Inc",           city: "San Diego, CA",    photo: "tyson-youngs",        linkedin: "https://www.linkedin.com/in/tyson-youngs-801245109/" },
    { name: "David Garbuz",        firm: "Oberfeld Snowcap",          city: "Toronto, Canada",  photo: "david-garbuz",        linkedin: "https://www.linkedin.com/in/david-garbuz-60908360/" }
  ],

  // Member sign-in: SHA-256 of "<salt>:<passcode lowercased>". Plain passcodes live in member-passcodes.csv (not committed).
  passSalt: "a908b5b159a6ac79",
  passHashes: {
    "Abby Walsh": "a1ea9cbb8a881eec8cb5633beb32ea42e749d26092f2eb4812828ca292c64cdc",
    "Benjamin Weiner": "b01926c11f7b8f91f4f7369687c3b6637c51820d0b2f3c46913f5dd900c3463c",
    "Jessica Branch": "622203cf2b7b25cdee6508d8199a3926ddb69e12cb13857c5277393a8cda73ff",
    "John Bassi": "044b9ce8259d3b4ad8ba3f03ae67c32862a667005deffc44951629333dffae5f",
    "Laura Harness": "6fe0f02a12cb3108fccc7693054474737b8de15c6fdd5e9ef0be92c49d9cdd7d",
    "Lindsay Zegans": "b1e4fd1f2ba326dcae7484a29c7d29ca9ca7448333d99ff238169533c2d7a0d4",
    "Logan Schenk": "ab388cb295caa0dcdfe0830b31dff6a4a709b82858853801404015985568fe53",
    "Marc Huberman": "3bf797705c1aad67649decce5414c1d53de87619505d6dd31413e9f1667d38a3",
    "Sarah Schank": "671a56f61c71be5dafdab878c7c45023d688ee72f3ca79fa07f74337827ba398",
    "Scott Benson": "974f97863758f994c0478ad1ac4fd9da0a054210cdf9752e95afd919d1b13451",
    "Jacqueline Stone": "16bffd2324e78de90ea87f737babfc7c6539f08f525130f4dff793f1f0c6d5b0",
    "Mike Thomas": "22dc17809f63c87ad5f029526415d224025e3130628761d08217f50e36cdc9a4",
    "Harper Sigman": "a29d35c8732eefd60ec9029863131f6c8b8b2042d29fe944beb2a5c705079a29",
    "Patrick Conly": "6492ff2f2709a412a8ba7a85d27b8f874b333c239917c2ee64b6bf3a46c5780d",
    "Isabella Sorrentino": "d71b98cc4611f5ecfb3e74ab71aab2e3d426bd38d1f95c020b6cf755878ebe4d",
    "Alberto Caballero": "f157c0efabf71c081e339893cb906483cea263df2243a20d67c145fa7799377d",
    "Tyson Youngs": "c82dab0f170ee2bbb7673e945f5feb8b623d3b22d32cf5a5ddcc219c7127fea8",
    "David Garbuz": "978c42b85da1dbea233537bdccf8a78a0bf0cc3888e4afb0f06d17890d0b4011"
  },

  // PLACEHOLDER schedule — swap in the real 2026–27 calendar.
  events: [
    { id: "q4-2026", title: "Q4 Quarterly Meetup",        date: "2026-10-22", time: "6:00 PM",  city: "Atlanta, GA",   venue: "Venue TBA",        type: "Quarterly",  blurb: "Deal share, market roundtable, and dinner. Bring your best retail expansion intel." },
    { id: "q1-2027", title: "Q1 Market Intel Summit",     date: "2027-01-28", time: "5:30 PM",  city: "Miami, FL",     venue: "Venue TBA",        type: "Quarterly",  blurb: "Kick off the year with a market-by-market outlook from every member city." },
    { id: "q2-2027", title: "Q2 Quarterly Meetup",        date: "2027-04-15", time: "6:00 PM",  city: "Chicago, IL",   venue: "Venue TBA",        type: "Quarterly",  blurb: "Tenant rep hot takes, disruptor watch, and a group dinner." },
    { id: "recon-2027", title: "Kinetic @ RECON",          date: "2027-05-17", time: "All day",  city: "Las Vegas, NV", venue: "ICSC Las Vegas",   type: "Signature",  blurb: "Our exclusive members-only RECON experience. The one you don't miss." }
  ],

  gallery: [
    { src: "assets/kinetic-1.jpg", caption: "Kinetic dinner" },
    { src: "assets/kinetic-2.jpg", caption: "Kinetic in Chicago" }
  ],

  // PLACEHOLDER quotes — replace with real member testimonials.
  testimonials: [
    { quote: "I've closed deals with people I met at a Kinetic dinner. It's the only network where everyone actually picks up the phone.", who: "Kinetic Member", role: "Retail Broker · Southeast" },
    { quote: "Market intel from 18 cities, from people my age who are grinding the same way I am. That's the unfair advantage.", who: "Kinetic Member", role: "Tenant Rep · Northeast" },
    { quote: "RECON with this group is a completely different experience. Warm intros, zero small talk.", who: "Kinetic Member", role: "Investment Sales · West" }
  ],

  channels: [
    { id: "general",  label: "General",      emoji: "💬" },
    { id: "deals",    label: "Deals",        emoji: "🤝" },
    { id: "intel",    label: "Market Intel", emoji: "📈" },
    { id: "events",   label: "Events",       emoji: "📅" },
    { id: "offtopic", label: "Off Topic",    emoji: "🎉" }
  ],

  docFolders: ["Market Reports", "Marketing & Brand", "Event Materials", "Templates", "Other"],

  // The only seeded document is the real logo file; everything else is added by members.
  seedDocs: [
    { id: "d-logo", kind: "file", title: "Kinetic logo (PNG)", name: "kinetic-logo.png", src: "assets/kinetic-logo.png", size: 0, folder: "Marketing & Brand", by: "Kinetic Team", ageHours: 48 }
  ],

  seedPosts: [
    { id: "p1", channel: "general", author: "Kinetic Team", title: "Welcome to the new Kinetic forum 👋", body: "This replaces the group text. Post deals, intel, questions, memes — upvote what's useful and it'll float to the top.", score: 14, ageHours: 3, comments: [
      { author: "Kinetic Team", body: "Pro tip: add it to your phone's home screen so it feels like an app.", ageHours: 2 }
    ]},
    { id: "p2", channel: "intel", author: "Kinetic Team", title: "What's the most active retail category in your market right now?", body: "Drop your city + the tenant categories you're seeing expand the fastest. Let's build a quick national snapshot before Q4.", score: 9, ageHours: 20, comments: [] },
    { id: "p3", channel: "events", author: "Kinetic Team", title: "Q4 Meetup — RSVP is live", body: "Head to the Events tab to lock in your spot. Remember: 3 of 4 events a year keeps your membership active.", score: 7, ageHours: 30, comments: [] }
  ]
};
