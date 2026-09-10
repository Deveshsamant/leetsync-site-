# -*- coding: utf-8 -*-
"""Build terms.html from index.html's own chrome, and link it."""
import io

SITE = r'E:\LeetSync-main\leetsync-site'
INDEX = SITE + r'\index.html'
OUT = SITE + r'\terms.html'
URL = 'https://leetsync-site.vercel.app'

H = ('font-family:var(--f-head);font-weight:var(--head-w);'
     'letter-spacing:var(--head-ls);text-transform:var(--head-tt)')
MONO = 'font-family:var(--f-mono)'

html = io.open(INDEX, encoding='utf-8').read()
lines = html.split('\n')

head_end = next(i for i, l in enumerate(lines) if l.strip() == '</head>')
main_open = next(i for i, l in enumerate(lines) if '<main id="top">' in l)
foot_open = next(i for i, l in enumerate(lines) if l.startswith('  <footer'))

head = '\n'.join(lines[:head_end + 1])
chrome = '\n'.join(lines[head_end + 1:main_open])
tail = '\n'.join(lines[foot_open:])

# The rail steps through the home page's sections and this page has none.
import re
chrome = re.sub(r'\n  <div data-rail[\s\S]*?\n  </div>\n', '\n', chrome, count=1)
assert 'data-rail' not in chrome, 'the rail did not come out cleanly'

TITLE = 'Terms and conditions — LeetSync'
DESC = ('The terms you accept by using LeetSync: what it does with your GitHub '
        'token and repository, what usage data is shared and only if you opt in, '
        'and what is not promised.')

for pat, rep in [
    (r'<title>[^<]*</title>', '<title>%s</title>' % TITLE),
    (r'<meta name="description" content="[^"]*">',
     '<meta name="description" content="%s">' % DESC),
    (r'<link rel="canonical" href="[^"]*">',
     '<link rel="canonical" href="%s/terms">' % URL),
    (r'<meta property="og:title" content="[^"]*">',
     '<meta property="og:title" content="%s">' % TITLE),
    (r'<meta property="og:description" content="[^"]*">',
     '<meta property="og:description" content="%s">' % DESC),
    (r'<meta property="og:url" content="[^"]*">',
     '<meta property="og:url" content="%s/terms">' % URL),
    (r'<meta name="twitter:title" content="[^"]*">',
     '<meta name="twitter:title" content="%s">' % TITLE),
    (r'<meta name="twitter:description" content="[^"]*">',
     '<meta name="twitter:description" content="%s">' % DESC),
]:
    assert re.search(pat, head), pat
    head = re.sub(pat, rep, head, count=1)


SECTIONS = [
    ('What LeetSync is',
     ['LeetSync is a Chrome extension that watches for accepted submissions on '
      'LeetCode and commits them to a GitHub repository you nominate. It is free '
      'and its source is public.',
      'It is not affiliated with, endorsed by, or connected to LeetCode or GitHub. '
      'Those are other people&rsquo;s services, and your use of them is governed by '
      'their terms, not these.']),

    ('Your token and your repository',
     ['You supply a GitHub token and name the repository. LeetSync writes to that '
      'repository and nowhere else.',
      'The token is held in Chrome&rsquo;s own storage on your computer and is sent '
      'only to <code>api.github.com</code>. It is never sent to LeetSync&rsquo;s '
      'server, because there is no code path that would send it and no column that '
      'would hold it.',
      'Keeping the token scoped tightly is your call and your responsibility. A '
      'fine-grained token limited to one repository with <strong>Contents: Read and '
      'write</strong> is all the extension needs.']),

    ('Usage data is optional',
     ['Usage reporting is off unless you turn it on, and you are asked once during '
      'setup. Nothing about how the extension works depends on your answer.',
      'If you turn it on, what is sent is: the username you chose, the extension '
      'version, your theme and README theme, which study sheets you use and how far '
      'through them you are, and every submission result &mdash; problem, difficulty, '
      'language, verdict, runtime and memory.',
      'It also places your username and your score on the public leaderboard in the '
      'Battle tab, where every other LeetSync user can see them. Clearing your '
      'username makes you Anonymous there; turning reporting off removes you '
      'entirely.',
      'Separately, and on by default, an activity ping sends a random install ID and '
      'the version number at most twice a day, so an install still in use can be told '
      'apart from one that was abandoned. It has its own switch. With both switches '
      'off, nothing leaves your browser.']),

    ('Your solution code',
     ['Sharing your solution code with LeetSync&rsquo;s server is a third switch, '
      'and it stays off even when usage reporting is on. Turn it on and the source of '
      'each accepted solution is sent along with the result &mdash; comments included, '
      'so leave it off if your code carries anything personal.',
      'This is separate from pushing your code to your own repository, which is the '
      'thing the extension is for and which happens regardless.']),

    ('Messages and feedback',
     ['Feedback, issues and suggestions you send from Settings reach the developer '
      'with your username, your install ID and the extension version attached. '
      'Nothing else goes with them, and they work whether or not usage reporting is '
      'on.',
      'The developer may reply, and may send occasional announcements. Both appear '
      'inside the extension, once, and both can be dismissed.']),

    ('What is not promised',
     ['LeetSync is provided as it is, without warranty of any kind. It depends on '
      'LeetCode&rsquo;s pages and GitHub&rsquo;s API, neither of which is under the '
      'developer&rsquo;s control, and either can change in a way that breaks it.',
      'It is not a backup service. Keep your own copies of anything you cannot afford '
      'to lose. To the extent the law allows, the developer is not liable for lost '
      'work, lost data, or anything else arising from using it.',
      'Features may change or be withdrawn, and the extension may stop being '
      'maintained.']),

    ('Using it fairly',
     ['Do not use LeetSync to break LeetCode&rsquo;s or GitHub&rsquo;s terms, to '
      'publish other people&rsquo;s work as your own, or to place anything on the '
      'public leaderboard that misrepresents who you are. Usernames that impersonate '
      'someone else may be removed.']),

    ('Changes',
     ['These terms may change. The date at the top says when they last did. '
      'Continuing to use the extension after a change means you accept the revised '
      'terms; if you do not, uninstall it and, if you like, sign out first so your '
      'progress is published to your repository.']),

    ('Contact',
     ['Questions, or anything that looks wrong here: open an issue at '
      '<a data-policy-link href="https://github.com/Deveshsamant/LeetSync/issues" '
      'style="color:var(--ac);text-decoration:none;border-bottom:1px solid var(--ac-bd)">'
      'github.com/Deveshsamant/LeetSync/issues</a>, or use the feedback box in the '
      'extension&rsquo;s Settings.']),
]


def section(n, title, paras):
    body = ''.join(
        '\n          <p style="color:var(--tx3);font-size:15.5px;line-height:1.65;'
        'margin:0 0 14px;text-wrap:pretty">%s</p>' % p for p in paras)
    return (
        '\n      <section data-reveal="up" style="display:grid;'
        'grid-template-columns:auto minmax(0,1fr);gap:18px;align-items:start;'
        'padding:26px 0;border-top:1px solid var(--bd-soft)">'
        '\n        <span style="' + MONO + ';font-size:11px;letter-spacing:.1em;'
        'color:var(--ac);padding-top:6px;transition:color .45s">%02d</span>' % n +
        '\n        <div>'
        '\n          <h2 style="' + H + ';margin:0 0 12px;line-height:1.15;'
        'font-size:clamp(19px,2.4vw,24px)">' + title + '</h2>' + body +
        '\n        </div>'
        '\n      </section>')


page = (
    head.replace('<!DOCTYPE html>',
                 '<!DOCTYPE html>\n<!-- Generated by scripts/build-terms.py from '
                 'index.html. Edit the script, then re-run. -->') +
    chrome +
    '\n  <main id="top">'
    '\n    <section style="padding:clamp(52px,8vw,96px) clamp(16px,4vw,44px);'
    'max-width:860px;margin:0 auto">'
    '\n      <div style="margin-bottom:clamp(24px,4vw,40px)">'
    '\n        <span data-reveal="up" style="display:inline-block;' + MONO + ';'
    'font-size:11px;letter-spacing:.16em;text-transform:uppercase;color:var(--kick-c);'
    'font-weight:var(--kick-w);margin-bottom:14px">Last updated 10 September 2026</span>'
    '\n        <h1 data-reveal="up" data-reveal-delay="60" style="' + H + ';margin:0;'
    'line-height:1.05;font-size:clamp(32px,5vw,52px)">Terms and conditions</h1>'
    '\n        <p data-reveal="up" data-reveal-delay="120" style="color:var(--tx3);'
    'font-size:16.5px;line-height:1.6;margin:16px 0 0;text-wrap:pretty">'
    '\n          Written to be read. Nine short sections covering what LeetSync does'
    '\n          with your token and your repository, what it shares and only if you'
    '\n          say so, and what it does not promise.'
    '\n        </p>'
    '\n      </div>' +
    ''.join(section(i, t, p) for i, (t, p) in enumerate(SECTIONS, 1)) +
    '\n    </section>'
    '\n  </main>\n' + tail)

io.open(OUT, 'w', encoding='utf-8', newline='').write(page)
print('terms.html written:', len(page), 'chars')


# ── Link it from the footer and the privacy section ──────────
def once(old, new):
    global html
    assert html.count(old) == 1, old[:70]
    html = html.replace(old, new, 1)


once('<a data-foot-link href="https://github.com/Deveshsamant/LeetSync/blob/main/'
     'PRIVACY_POLICY.md" style="color:var(--tx3);text-decoration:none;font-size:14px;'
     'transition:color .2s">Privacy</a>',
     '<a data-foot-link href="/terms" style="color:var(--tx3);text-decoration:none;'
     'font-size:14px;transition:color .2s">Terms</a>\n'
     '      <a data-foot-link href="https://github.com/Deveshsamant/LeetSync/blob/main/'
     'PRIVACY_POLICY.md" style="color:var(--tx3);text-decoration:none;font-size:14px;'
     'transition:color .2s">Privacy</a>')

once('<a data-policy-link href="https://github.com/Deveshsamant/LeetSync/blob/main/'
     'PRIVACY_POLICY.md" style="color:var(--ac);text-decoration:none;'
     'border-bottom:1px solid var(--ac-bd)">Read the full policy &rarr;</a>',
     '<a data-policy-link href="/terms" style="color:var(--ac);text-decoration:none;'
     'border-bottom:1px solid var(--ac-bd)">Terms and conditions &rarr;</a>\n'
     '          <a data-policy-link href="https://github.com/Deveshsamant/LeetSync/'
     'blob/main/PRIVACY_POLICY.md" style="color:var(--ac);text-decoration:none;'
     'border-bottom:1px solid var(--ac-bd)">Full privacy policy &rarr;</a>')

io.open(INDEX, 'w', encoding='utf-8', newline='').write(html)
print('index.html links /terms from the footer and the privacy section')
