const fs = require('fs');
let code = fs.readFileSync('services/geminiService.ts', 'utf-8');

const podcastFunction = `
export interface PodcastSegment {
  speaker: 'Host 1' | 'Host 2';
  text: string;
}

export const generatePodcastScript = async (text: string, focus: string, length: 'short' | 'medium' | 'long', hosts: 1 | 2, fileData?: string, fileMime?: string): Promise<PodcastSegment[]> => {
  const data = await fetchApi('podcast-script', { text, focus, length, hosts, fileData, fileMime });
  return data;
};
`;

if (!code.includes('generatePodcastScript')) {
  code = code + '\n' + podcastFunction;
  fs.writeFileSync('services/geminiService.ts', code);
  console.log('Added generatePodcastScript to geminiService.ts');
}
