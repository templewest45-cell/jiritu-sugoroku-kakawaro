import React from 'react';

interface Props {
  text: string;
}

export function RubyText({ text }: Props) {
  if (!text) return null;
  
  // 正規表現で {漢字|かんじ} の部分を分割
  const parts = text.split(/(\{[^|]+\|[^}]+\})/g);
  
  return (
    <>
      {parts.map((part, i) => {
        const match = part.match(/\{([^|]+)\|([^}]+)\}/);
        if (match) {
          return (
            <ruby key={i}>
              {match[1]}<rt>{match[2]}</rt>
            </ruby>
          );
        }
        return <React.Fragment key={i}>{part}</React.Fragment>;
      })}
    </>
  );
}
