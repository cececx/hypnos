import sys

INFILE = 'flow_script_{}'.format(sys.argv[1])
OUTFILE = 'flow_script_{}_formatted'.format(sys.argv[1])
START = int(sys.argv[2])
WHITE_LIST = ['-1', '-2']

with open(INFILE, 'r') as f:
  lines = [line.rstrip() for line in f.readlines()]

# Get the original id list.
ids = []
for line in lines:
  if line.strip() and not line.startswith('  '):
    ids.append(line.split('-')[0])

# Create id map.
new_ids = [str(i) for i in range(START, START + len(ids))]
id_map = {}
for i in range(len(ids)):
  id_map[ids[i]] = new_ids[i]

# Replace old id with new id.
new_lines = []
for line in lines:
  try:
    if not line.strip():
      continue
    if not line.startswith('  '):
      old_id = line.split('-')[0]
      if not old_id in WHITE_LIST:
        line = id_map[old_id] + line[len(old_id):]
    if '>>' in line:
      old_id = line.split('>>', 1)[1]
      if not old_id in WHITE_LIST:
        line = line[:-len(old_id)] + id_map[old_id]
    new_lines.append(line)
  except:
    print(line)
    raise

with open(OUTFILE, 'w') as f:
  f.write('\n'.join(new_lines))