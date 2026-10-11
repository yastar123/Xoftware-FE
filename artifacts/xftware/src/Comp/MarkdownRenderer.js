import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { 
  Typography, Box, Paper, Table, TableBody, TableCell, 
  TableContainer, TableHead, TableRow, Chip, alpha, useTheme,
  Tooltip, IconButton, Stack, Divider
} from '@mui/material';
import { ContentCopy, Info, Lightbulb, Warning } from '@mui/icons-material';
import { toast } from 'react-toastify';
import SyntaxHighlighter from 'react-syntax-highlighter/dist/esm/prism';
import vscDarkPlus from 'react-syntax-highlighter/dist/esm/styles/prism/vsc-dark-plus';
import materialLight from 'react-syntax-highlighter/dist/esm/styles/prism/material-light';

const CodeBlock = ({ children, language, inline }) => {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const code = String(children).replace(/\n$/, '');
  
  if (inline) {
    return (
      <Box component="code" sx={{ 
        px: 0.8, py: 0.2, borderRadius: 1, 
        bgcolor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.04)',
        color: isDark ? '#f87171' : '#e11d48',
        fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
        fontSize: '0.85em', fontWeight: 600, wordBreak: 'break-all'
      }}>{code}</Box>
    );
  }

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    toast.success('Disalin ke clipboard');
  };

  return (
    <Box sx={{ position: 'relative', mb: 3, mt: 2, width: '100%', minWidth: 0, maxWidth: '100%' }}>
      <Box sx={{ 
        pt: 5, borderRadius: 3, bgcolor: isDark ? '#1e1e1e' : '#fafafa', 
        border: '1px solid', borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)',
        boxShadow: '0 8px 30px rgba(0,0,0,0.12)',
        overflow: 'hidden', width: '100%', minWidth: 0,
        position: 'relative'
      }}>
        {/* Syntax Highlighter Container */}
        <Box sx={{
          maxWidth: '100%', overflowX: 'auto',
          '&::-webkit-scrollbar': { height: 6 },
          '&::-webkit-scrollbar-thumb': { bgcolor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)', borderRadius: 4 }
        }}>
          <SyntaxHighlighter
            language={language || 'text'}
            style={isDark ? vscDarkPlus : materialLight}
            customStyle={{
              margin: 0,
              padding: '20px',
              backgroundColor: 'transparent',
              fontSize: '0.85rem',
              fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
              lineHeight: 1.6
            }}
          >
            {code}
          </SyntaxHighlighter>
        </Box>
      </Box>

      {/* Top Bar controls */}
      <Box sx={{ position: 'absolute', top: 12, right: 12, display: 'flex', alignItems: 'center', gap: 1 }}>
        {language && <Typography variant="caption" sx={{ color: isDark ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.4)', fontWeight: 800, textTransform: 'uppercase', mr: 1 }}>{language}</Typography>}
        <Tooltip title="Salin Kode">
          <IconButton size="small" onClick={handleCopy} sx={{ color: isDark ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.4)', '&:hover': { color: isDark ? '#fff' : '#000', bgcolor: alpha(isDark ? '#fff' : '#000', 0.08) } }}>
            <ContentCopy sx={{ fontSize: 16 }} />
          </IconButton>
        </Tooltip>
      </Box>
      <Box sx={{ position: 'absolute', top: 16, left: 16, display: 'flex', gap: 1 }}>
        <Box sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: '#ff5f56', opacity: 0.8 }} />
        <Box sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: '#ffbd2e', opacity: 0.8 }} />
        <Box sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: '#27c93f', opacity: 0.8 }} />
      </Box>
    </Box>
  );
};

const Components = (isDark) => ({
  h1: ({ children }) => <Typography variant="h3" fontWeight={900} sx={{ letterSpacing: '-0.04em', mt: 6, mb: 4, color: isDark ? '#f8fafc' : '#0f172a', fontSize: { xs: '1.75rem', md: '3rem' }, wordBreak: 'break-word' }}>{children}</Typography>,
  h2: ({ children }) => <Typography variant="h5" fontWeight={900} sx={{ letterSpacing: '-0.02em', mt: 5, mb: 2.5, color: isDark ? '#f1f5f9' : '#1e293b', borderBottom: '1px solid', borderColor: alpha(isDark ? '#fff' : '#000', 0.05), pb: 1, fontSize: { xs: '1.4rem', md: '1.8rem' }, wordBreak: 'break-word' }}>{children}</Typography>,
  h3: ({ children }) => <Typography variant="h6" fontWeight={800} sx={{ mt: 4, mb: 2, color: isDark ? '#e2e8f0' : '#334155', wordBreak: 'break-word' }}>{children}</Typography>,
  p: ({ children }) => <Typography variant="body1" sx={{ color: isDark ? '#94a3b8' : '#475569', lineHeight: 1.85, mb: 3, wordBreak: 'break-word' }}>{children}</Typography>,
  blockquote: ({ children }) => {
    const textArr = React.Children.toArray(children);
    const text = textArr.map(c => (c && c.props && c.props.children) ? c.props.children : '').join('');
    let color = '#6366f1';
    let icon = <Info />;
    if (text.includes('[!TIP]')) { color = '#f59e0b'; icon = <Lightbulb />; }
    else if (text.includes('[!WARNING]') || text.includes('[!CAUTION]')) { color = '#ef4444'; icon = <Warning />; }

    const cleanChildren = React.Children.map(children, child => {
      if (child && child.props && typeof child.props.children === 'string') {
        return React.cloneElement(child, {
          children: child.props.children.replace(/\[!(TIP|WARNING|CAUTION|IMPORTANT|NOTE)\]\n?/, '')
        });
      }
      return child;
    });

    return (
      <Box sx={{ 
        my: 4, p: { xs: 2, md: 3 }, borderRadius: 3, bgcolor: alpha(color, isDark ? 0.12 : 0.06), borderLeft: `4px solid ${color}`, 
        display: 'flex', gap: { xs: 1.5, md: 2.5 }, boxShadow: `0 4px 20px ${alpha(color, 0.05)}`,
        width: '100%', minWidth: 0, boxSizing: 'border-box'
      }}>
        <Box sx={{ color, mt: 0.3, display: 'flex', flexShrink: 0 }}>{icon}</Box>
        <Box sx={{ flexGrow: 1, color: isDark ? '#e2e8f0' : '#1e293b', minWidth: 0, wordBreak: 'break-word' }}>{cleanChildren}</Box>
      </Box>
    );
  },
  table: ({ children }) => (
    <Box sx={{ 
      my: 4, width: '100%', maxWidth: '100%', minWidth: 0, overflowX: 'auto', borderRadius: 4, 
      border: '1px solid', borderColor: isDark ? 'rgba(255,255,255,0.1)' : '#e2e8f0', 
      boxShadow: '0 4px 20px rgba(0,0,0,0.02)', bgcolor: isDark ? '#1e293b' : '#fff',
      '&::-webkit-scrollbar': { height: 6 },
      '&::-webkit-scrollbar-thumb': { bgcolor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)', borderRadius: 4 }
    }}>
      <Table size="small" sx={{ minWidth: 600 }}>{children}</Table>
    </Box>
  ),
  thead: ({ children }) => <TableHead sx={{ bgcolor: isDark ? '#0f172a' : '#f8fafc' }}>{children}</TableHead>,
  tbody: ({ children }) => <TableBody>{children}</TableBody>,
  tr: ({ children }) => <TableRow sx={{ '&:hover': { bgcolor: isDark ? 'rgba(255,255,255,0.02)' : '#f1f5f9' } }}>{children}</TableRow>,
  th: ({ children }) => <TableCell sx={{ fontWeight: 800, color: isDark ? '#94a3b8' : '#475569', py: 2.5, px: 3, borderBottom: '1px solid', borderColor: isDark ? 'rgba(255,255,255,0.1)' : '#e2e8f0' }}>{children}</TableCell>,
  td: ({ children }) => {
    let content = children;
    if (children === 'Ya') content = <Chip label="Wajib" size="small" color="error" sx={{ height: 22, fontSize: 11, fontWeight: 800, borderRadius: 1.5 }} />;
    else if (children === 'Tidak') content = <Chip label="Opsional" size="small" variant="outlined" sx={{ height: 22, fontSize: 11, fontWeight: 700, borderRadius: 1.5 }} />;
    return <TableCell sx={{ py: 2, px: 3, color: isDark ? '#cbd5e1' : '#1e293b', borderBottom: '1px solid', borderColor: isDark ? 'rgba(255,255,255,0.1)' : '#e2e8f0' }}>{content}</TableCell>;
  },
  pre: ({ children }) => <>{children}</>,
  code: ({node, className, children, ...props}) => {
    const match = /language-(\w+)/.exec(className || '');
    return <CodeBlock inline={!className} language={match ? match[1] : null} {...props}>{children}</CodeBlock>;
  },
  hr: () => <Divider sx={{ my: 8, opacity: isDark ? 0.08 : 0.4 }} />,
  ul: ({ children }) => <Box component="ul" sx={{ pl: { xs: 2.5, md: 4 }, mb: 4, color: isDark ? '#94a3b8' : '#475569', wordBreak: 'break-word' }}>{children}</Box>,
  li: ({ children }) => <Box component="li" sx={{ mb: 1.5, lineHeight: 1.8, wordBreak: 'break-word' }}>{children}</Box>,
  strong: ({ children }) => <Box component="strong" sx={{ fontWeight: 900, color: isDark ? '#f8fafc' : '#0f172a' }}>{children}</Box>,
  a: ({ children, href }) => <Box component="a" href={href} sx={{ color: '#6366f1', textDecoration: 'none', fontWeight: 700, borderBottom: '1px solid transparent', transition: '0.2s', '&:hover': { borderBottomColor: '#6366f1' }, wordBreak: 'break-all' }}>{children}</Box>
});

export default function MarkdownRenderer({ content }) {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  return (
    <Box sx={{ width: '100%', minWidth: 0, maxWidth: '100%' }}>
      <ReactMarkdown remarkPlugins={[remarkGfm]} components={Components(isDark)}>
        {content}
      </ReactMarkdown>
    </Box>
  );
}
