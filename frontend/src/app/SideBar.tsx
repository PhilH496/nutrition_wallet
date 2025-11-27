import { ScrollArea, Text } from '@mantine/core';
import { LinksGroup } from './NavbarLinksGroup';
import classes from './NavbarNested.module.css';
import { FaUtensils } from "react-icons/fa";

const mockdata = [
  { label: '01-01-2024', icon: FaUtensils },
  {
    label: '01-02-2024',
    icon: FaUtensils,
    links: [
      { label: 'Banana: 105 cal', link: '/table' },
      { label: 'Greek Yogurt: 100 cal', link: '/table' },
      { label: 'Oatmeal: 150 cal', link: '/table' },
      { label: 'Almonds: 164 cal', link: '/table' },
    ],
  },
  {
    label: '01-03-2024',
    icon: FaUtensils,
    links: [
      { label: 'Grilled Chicken: 284 cal', link: '/' },
      { label: 'Brown Rice: 216 cal', link: '/' },
      { label: 'Broccoli: 55 cal', link: '/' },
    ],
  },
  { label: '01-04-2024', icon: FaUtensils },
  { label: '01-05-2024', icon: FaUtensils },
  { label: '01-06-2024', icon: FaUtensils },
  {
    label: '01-07-2024',
    icon: FaUtensils,
    links: [
      { label: 'Salmon Fillet: 412 cal', link: '/' },
      { label: 'Sweet Potato: 112 cal', link: '/' },
      { label: 'Asparagus: 20 cal', link: '/' },
    ],
  },
];

export function SideBar() {
  const links = mockdata.map((item) => <LinksGroup {...item} key={item.label} />);

  return (
    <nav>
      <div className='border-b border-[var(--dark-green)]'>

        <Text className="text-[var(--dark-green)] text-3xl font-bold" >
          History
        </Text>
      </div>
      <ScrollArea className={classes.links}>
        <div className={classes.linksInner}>{links}</div>
      </ScrollArea>
    </nav>
  );
}