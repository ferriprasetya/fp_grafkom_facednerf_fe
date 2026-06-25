"use client";

import Image from "next/image";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { ModelPanel } from "@/components/model-panel";
import type { MaterialMode } from "@/components/ply-mesh";
import { COMPARISON_SUBJECTS } from "@/lib/comparison-data";

export function ComparisonWorkspace() {
  const [subjectId, setSubjectId] = useState(COMPARISON_SUBJECTS[0].id);
  const [wireframe, setWireframe] = useState(false);
  const [materialMode, setMaterialMode] =
    useState<MaterialMode>("vertex");

  const subject =
    COMPARISON_SUBJECTS.find((entry) => entry.id === subjectId) ??
    COMPARISON_SUBJECTS[0];

  return (
    <div className='grid min-h-[calc(100vh-65px)] lg:grid-cols-[280px_1fr]'>
      <aside className='flex flex-col gap-6 border-b p-5 lg:border-r lg:border-b-0'>
        <section className='flex flex-col gap-2'>
          <p className='text-xs font-medium uppercase tracking-wider text-muted-foreground'>
            Input
          </p>
          <div className='relative aspect-[4/5] overflow-hidden rounded-xl bg-muted'>
            <Image
              src={subject.sourceImage}
              alt={`${subject.label} input`}
              fill
              sizes='280px'
              className='object-cover'
              priority
            />
          </div>
        </section>

        <section className='flex flex-col gap-2'>
          <p className='text-xs font-medium uppercase tracking-wider text-muted-foreground'>
            Subject
          </p>
          <div className='grid grid-cols-2 gap-2'>
            {COMPARISON_SUBJECTS.map((entry) => (
              <Button
                key={entry.id}
                variant={entry.id === subject.id ? "default" : "outline"}
                size='sm'
                onClick={() => setSubjectId(entry.id)}
              >
                {entry.label}
              </Button>
            ))}
          </div>
        </section>

        <section className='flex flex-col gap-3'>
          <p className='text-xs font-medium uppercase tracking-wider text-muted-foreground'>
            View
          </p>
          <div className='flex items-center justify-between'>
            <span className='text-sm'>Wireframe</span>
            <Switch
              checked={wireframe}
              onCheckedChange={setWireframe}
              aria-label='Toggle wireframe'
            />
          </div>
          <div className='grid grid-cols-2 gap-2'>
            <Button
              variant={materialMode === "vertex" ? "default" : "outline"}
              size='sm'
              onClick={() => setMaterialMode("vertex")}
            >
              Vertex color
            </Button>
            <Button
              variant={materialMode === "skin" ? "default" : "outline"}
              size='sm'
              onClick={() => setMaterialMode("skin")}
            >
              Geometry
            </Button>
          </div>
        </section>
      </aside>

      <div className='grid gap-4 p-4 lg:grid-cols-2'>
        <ModelPanel
          key={`${subject.id}-facednerf`}
          title='FaceDNeRF'
          subtitle='Face-specific reconstruction'
          modelUrl={subject.facednerfModel}
          downloadUrl={subject.facednerfModel}
          wireframe={wireframe}
          materialMode={materialMode}
        />
        <ModelPanel
          key={`${subject.id}-triposr`}
          title='TripoSR'
          subtitle='Feed-forward reconstruction'
          modelUrl={subject.triposrModel}
          downloadUrl={subject.triposrModel}
          wireframe={wireframe}
          materialMode={materialMode}
        />
      </div>
    </div>
  );
}
