import json
import sys

CONFIG_FILE = 'flow_config_{}'.format(sys.argv[1])
OUTPUT_FILE = 'flow_{}.json'.format(sys.argv[1])
UNIQUE_PREFIX = 'UNIQUE**'
OPTION_TYPE_MAP = {
  'S': 'single',
  'M': 'multiple',
  'P': 'picker'
}


def create_chatbot_node(msg):
  node = {}
  node['type'] = 'CHATBOT'
  node['content'] = []
  tokens = msg['content'].split('>>')
  node['content'].append({
    'text': tokens[0],
    'next': int(tokens[1])
  })
  return node


def parse_option_display(line):
  if '//' in line:
    return line.split('//', 1)
  else:
    return line, line


def create_single_content(lines):
  content = []
  for line in lines:
    tokens = line.split('>>')
    text, option = parse_option_display(tokens[0])
    next = int(tokens[1])
    content.append({
      'text': text,
      'option': option,
      'next': next
    })
  return content


def create_multi_content(lines):
  content = []
  for line in lines:
    unique = False
    if line.startswith(UNIQUE_PREFIX):
      unique = True
      line = line[len(UNIQUE_PREFIX):]
    text, option = parse_option_display(line)
    content.append({
      'text': text,
      'option': option,
      'unique': unique
    })
  return content


def create_picker_content(lines):
  return {
    'template': lines[0],
    'range': lines[1].split(','),
    'index': int(lines[2])
  }


OPTION_SWITCHER = {
  'S': create_single_content,
  'M': create_multi_content,
  'P': create_picker_content
}


def create_user_node(msg):
  node = {}
  node['type'] = 'USER'
  node['option_type'] = OPTION_TYPE_MAP[msg['type']]
  node['content'] = OPTION_SWITCHER[msg['type']](msg['options'])
  return node


def add_message(flow, msg):
  if msg['type'] == 'B':
    item = create_chatbot_node(msg)
  else:
    item = create_user_node(msg)
  flow[msg['id']] = item


def parse_config(flow, lines):
  i = 0
  while (i < len(lines)):
    tokens = lines[i].split(':', 1)[0].split('-')
    msg = {}
    msg['content'] = lines[i].split(':', 1)[1].strip()
    msg['id'] = int(tokens[0])
    msg['type'] = tokens[1]
    msg['options'] = []
    while i < len(lines) - 1 and lines[i+1].startswith('  '):
      i += 1
      msg['options'].append(lines[i].strip())
    add_message(flow, msg)
    i += 1


def main():
  flow = {}
  with open(CONFIG_FILE, 'r') as f:
    parse_config(flow, f.readlines())
  print(flow)
  with open(OUTPUT_FILE, 'w') as f:
    json.dump(flow, f, indent=2, sort_keys=True)


if __name__ == '__main__':
  main()