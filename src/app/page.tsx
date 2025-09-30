import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function Home() {
  return (
    <div className="flex items-center justify-center min-h-screen w-full">
      <Card className="w-[450px] bg-red-200">
        <CardHeader>
          <CardTitle>App criado com Next.js + TailwindCSS + shadcn/ui</CardTitle>
          <CardDescription>Este é um card de exemplo.</CardDescription>
        </CardHeader>
        <CardContent>
          <Button>
            <a href="/report">Ver relatorios</a>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
