import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { expect, userEvent, within } from 'storybook/test';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './index.tsx';

const meta = {
  title: 'Primitives/Tabs',
  component: Tabs,
  tags: ['autodocs'],
  render: () => (
    <Tabs defaultValue="list">
      <TabsList aria-label="Schedule view">
        <TabsTrigger value="list">List</TabsTrigger>
        <TabsTrigger value="week">Week</TabsTrigger>
      </TabsList>
      <TabsContent value="list">Upcoming events grouped by day.</TabsContent>
      <TabsContent value="week">Week calendar.</TabsContent>
    </Tabs>
  ),
} satisfies Meta<typeof Tabs>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const ArrowKeys: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole('tab', { name: 'List' }));
    await userEvent.keyboard('{ArrowRight}');
    await expect(canvas.getByRole('tab', { name: 'Week' })).toHaveAttribute(
      'aria-selected',
      'true',
    );
    await expect(canvas.getByRole('tabpanel')).toHaveTextContent('Week calendar.');
  },
};
