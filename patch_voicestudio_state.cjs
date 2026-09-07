const fs = require('fs');
let code = fs.readFileSync('components/VoiceStudio.tsx', 'utf-8');

const newStates = `
  // Podcast State
  const [podcastText, setPodcastText] = useState('');
  const [podcastFocus, setPodcastFocus] = useState('');
  const [podcastLength, setPodcastLength] = useState<'short'|'medium'|'long'>('medium');
  const [podcastHosts, setPodcastHosts] = useState<1|2>(2);
  const [podcastVoice1, setPodcastVoice1] = useState<string>(VoiceName.CHARON);
  const [podcastVoice2, setPodcastVoice2] = useState<string>(VoiceName.KORE);
  const [podcastFile, setPodcastFile] = useState<File | null>(null);
  const [podcastFileData, setPodcastFileData] = useState<string | null>(null);
  const podcastFileInputRef = useRef<HTMLInputElement>(null);
  
  const [isGeneratingPodcast, setIsGeneratingPodcast] = useState(false);
  const [podcastScript, setPodcastScript] = useState<PodcastSegment[] | null>(null);
  
  const [isGeneratingPodcastAudio, setIsGeneratingPodcastAudio] = useState(false);
  const [podcastAudioProgress, setPodcastAudioProgress] = useState(0);
  const [podcastAudioUrl, setPodcastAudioUrl] = useState<string | null>(null);
`;

code = code.replace("const [activeTab, setActiveTab] = useState<'tts' | 'clone'>('tts');", "const [activeTab, setActiveTab] = useState<'tts' | 'clone' | 'podcast'>('tts');" + newStates);
fs.writeFileSync('components/VoiceStudio.tsx', code);
console.log('Patched states');
