import sys
import re
sys.path.insert(0, 'C:/Code/Sortify/code/server')
from app.rag import rag_engine, remove_emojis

# 1. Test rag.txt
with open('C:/Code/Sortify/code/rag.txt', 'r', encoding='utf-8') as f:
    text = f.read()

emojis = re.findall(r'[\U00010000-\U0010ffff\u2600-\u27ff\ufe00-\ufe0f\u200d\u2300-\u23ff\u2b50\u2b55\u203c\u2049\u25aa-\u25fe]', text)
assert len(emojis) == 0, f'Found {len(emojis)} emojis in rag.txt!'
print('PASS: Zero emojis in rag.txt')

with open('C:/Code/Sortify/code/server/rag.txt', 'r', encoding='utf-8') as f:
    server_text = f.read()

server_emojis = re.findall(r'[\U00010000-\U0010ffff\u2600-\u27ff\ufe00-\ufe0f\u200d\u2300-\u23ff\u2b50\u2b55\u203c\u2049\u25aa-\u25fe]', server_text)
assert len(server_emojis) == 0, f'Found {len(server_emojis)} emojis in server/rag.txt!'
print('PASS: Zero emojis in server/rag.txt')

assert len(rag_engine.chunks) >= 40, f'Expected at least 40 chunks, got {len(rag_engine.chunks)}'
print(f'PASS: Loaded {len(rag_engine.chunks)} diverse knowledge chunks')

# 2. Test queries and bullet formatting
test_queries = [
    'How do I dispose of a plastic bottle?',
    'What should I do with lithium batteries?',
    'Where does greasy pizza box go?',
    'Can I recycle light bulbs?',
    'How to throw away motor oil?',
    'What to do with expired prescription medicine?',
    'How to recycle clothes?',
    'Can soft plastic wrappers go in yellow bin?',
    'How do I dispose of disposable vapes?',
    'Can I recycle aerosol spray cans?',
    'Where do coffee pods go?',
    'What do I do with medicine blister packs?'
]

for q in test_queries:
    reply, ctx, trace = rag_engine.answer_query(q)
    assert len(reply) > 0, f'Empty reply for {q}'
    reply_emojis = re.findall(r'[\U00010000-\U0010ffff\u2600-\u27ff\ufe00-\ufe0f\u200d\u2300-\u23ff\u2b50\u2b55\u203c\u2049\u25aa-\u25fe]', reply)
    assert len(reply_emojis) == 0, f'Found emoji in reply for {q}: {reply_emojis}'
    assert '•' in reply, f'Expected bullet points in reply for {q}, got: {reply}'
    assert trace.retrieval_score > 0, f'Expected positive score for {q}'
    print(f'PASS: Query \"{q[:35]}...\" -> {len(reply)} chars, bullet formatted, 0 emojis, trace score {trace.retrieval_score}')

# 2b. Test explicit non-bullet request
prose_query = 'Explain in one paragraph without bullets how to dispose of plastic bottles'
prose_reply, _, _ = rag_engine.answer_query(prose_query)
assert '•' not in prose_reply, f'Expected no bullet points for explicit non-bullet request, got: {prose_reply}'
assert len(prose_reply) > 20, f'Expected substantive prose reply, got: {prose_reply}'
print(f'PASS: Explicit non-bullet request cleanly returned prose: \"{prose_reply[:60]}...\"')

# 3. Test remove_emojis utility
dirty = 'Warning ⚠️ Recycle ♻️ Great 👍 Check ✅'
clean = remove_emojis(dirty)
assert '⚠️' not in clean and '♻️' not in clean and '👍' not in clean and '✅' not in clean
print('PASS: remove_emojis cleanly strips symbols')

# 4. Test Qwen modes in Python RAG engine
local_reply, _, local_trace = rag_engine.answer_query('How to dispose of cardboard?', mode='local')
assert len(local_reply) > 0 and 'Local' in local_trace.model
print('PASS: Python RAG engine answer_query mode="local" works')

api_reply, _, api_trace = rag_engine.answer_query('How to dispose of cardboard?', mode='api', custom_api_url='http://invalid:9999')
assert len(api_reply) > 0 and 'API' in api_trace.model
print('PASS: Python RAG engine answer_query mode="api" falls back cleanly when offline')

print('\nALL PYTHON RAG TESTS PASSED!')
