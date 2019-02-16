import json

CONFIG_FILE = 'flow_text'
OUTPUT_FILE = 'flow.json'
UNIQUE_PREFIX = 'UNIQUE**'


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


def create_user_node(msg):
  node = {}
  node['type'] = 'USER'
  node['single_select'] = True if msg['type'] == 'S' else False
  if node['single_select']:
    node['content'] = create_single_content(msg['options'])
  else:
    node['content'] = create_multi_content(msg['options'])
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