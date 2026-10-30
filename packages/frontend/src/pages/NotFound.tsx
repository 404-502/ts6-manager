import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { FileQuestion } from 'lucide-react';

export default function NotFound() {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center space-y-4">
      <div className="h-16 w-16 rounded-2xl bg-muted/30 flex items-center justify-center">
        <FileQuestion className="h-8 w-8 text-muted-foreground" />
      </div>
      <h1 className="text-2xl font-semibold">页面未找到</h1>
      <p className="text-sm text-muted-foreground max-w-sm">
        您要访问的页面不存在或已被移动。
      </p>
      <Button variant="outline" onClick={() => navigate('/dashboard')}>
        返回仪表盘
      </Button>
    </div>
  );
}
