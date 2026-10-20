import { useEffect } from 'react';

export function usePageMeta(title, description) {
  useEffect(() => {
    if (title) {
      document.title = `${title} | राष्ट्रीय सनातन संस्कार सेवा संस्थान (ट्रस्ट)`;
    }
    if (description) {
      let metaDesc = document.querySelector('meta[name="description"]');
      if (!metaDesc) {
        metaDesc = document.createElement('meta');
        metaDesc.setAttribute('name', 'description');
        document.head.appendChild(metaDesc);
      }
      metaDesc.setAttribute('content', description);
    }
  }, [title, description]);
}

export default usePageMeta;
