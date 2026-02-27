export const defaultNodes = [
  {
    id: '0',
    type: 'sceneNode',
    position: { x: 0, y: 130 },
    data: {
      numericId: 0,
      image: '',
      title: '',
      text: 'You are at a crossroads in a dark forest. Two paths stretch before you, one to the left and one to the right. Which way do you go?',
      imagesize: '',
      choices: [
        { text: 'Go left.' },
        { text: 'Go right.' },
      ],
      isEnding: false,
      isGoodEnding: false,
    },
  },
  {
    id: '1',
    type: 'sceneNode',
    position: { x: 320, y: 30 },
    data: {
      numericId: 1,
      image: '',
      title: '',
      text: 'The left path leads to a sunlit clearing. In the center sits an ancient treasure chest, its lock long since rusted away.',
      imagesize: '',
      choices: [
        { text: 'Open the chest.' },
      ],
      isEnding: false,
      isGoodEnding: false,
    },
  },
  {
    id: '2',
    type: 'sceneNode',
    position: { x: 320, y: 230 },
    data: {
      numericId: 2,
      image: '',
      title: 'You Have Died',
      text: 'The right path conceals a hidden pit. You plummet into the darkness below.',
      imagesize: '',
      choices: [],
      isEnding: true,
      isGoodEnding: false,
      startOverText: "'''START OVER'''",
    },
  },
  {
    id: '3',
    type: 'sceneNode',
    position: { x: 640, y: 30 },
    data: {
      numericId: 3,
      image: '',
      title: 'You Won!',
      text: 'Inside the chest you find a king\'s ransom in gold coins, a jeweled crown, and a one-way portal back to civilization. You are rich beyond imagination.',
      imagesize: '',
      choices: [],
      isEnding: true,
      isGoodEnding: true,
      startOverText: "'''Play again?'''",
    },
  },
];

export const defaultEdges = [
  {
    id: 'e0-choice0-1',
    source: '0',
    sourceHandle: 'choice-0',
    target: '1',
    targetHandle: 'target',
  },
  {
    id: 'e0-choice1-2',
    source: '0',
    sourceHandle: 'choice-1',
    target: '2',
    targetHandle: 'target',
  },
  {
    id: 'e1-choice0-3',
    source: '1',
    sourceHandle: 'choice-0',
    target: '3',
    targetHandle: 'target',
  },
];

export function getInitialNextId(nodes) {
  return nodes.reduce((max, n) => Math.max(max, parseInt(n.id, 10)), -1) + 1;
}
